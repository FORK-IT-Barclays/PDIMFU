import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DecisionMatrix from '../components/DecisionMatrix';
import { Phone, RefreshCcw, Search, ShieldAlert, Filter, Check, Send, X, Download, Users } from 'lucide-react';
import { getAccounts, getLatestBatch, addIntervention } from '../services/api';
import { mockCustomers, batchProcessor as fallbackBatch } from '../data/mockData';

const InterventionQueue = () => {
    // ── API state ─────────────────────────────────────────────────────
    const [accounts, setAccounts] = useState([]);
    const [latestBatch, setLatestBatch] = useState(null);
    const [apiLoading, setApiLoading] = useState(true);
    const [apiError, setApiError] = useState(false);

    const fetchData = useCallback(async () => {
        setApiLoading(true);
        try {
            const [acctRes, batchRes] = await Promise.all([
                getAccounts({ limit: 100 }),
                getLatestBatch(),
            ]);
            setAccounts(acctRes.data || []);
            setLatestBatch(batchRes.data || null);
            setApiError(false);
        } catch {
            setApiError(true);
            setAccounts(mockCustomers);
        } finally {
            setApiLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Filters ───────────────────────────────────────────────────────
    const [tierFilter, setTierFilter] = useState('all');
    const [diagnosisFilter, setDiagnosisFilter] = useState('all');
    const [riskRange, setRiskRange] = useState([0, 100]);
    const [velocityMin, setVelocityMin] = useState('');
    const [sortBy, setSortBy] = useState('urgency');
    const [sortDir, setSortDir] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // ── Shortlist / batch ─────────────────────────────────────────────
    const [shortlisted, setShortlisted] = useState(new Set());
    const [batchSending, setBatchSending] = useState(false);
    const [batchSent, setBatchSent] = useState(false);
    const [batchAction, setBatchAction] = useState('RM_CALL');

    const allDiagnoses = useMemo(() => [...new Set(accounts.map(c => c.diagnosis))].sort(), [accounts]);

    const filteredCustomers = useMemo(() => {
        let list = [...accounts];
        if (tierFilter !== 'all') list = list.filter(c => c.tier === tierFilter);
        if (diagnosisFilter !== 'all') list = list.filter(c => c.diagnosis === diagnosisFilter);
        list = list.filter(c => (c.risk * 100) >= riskRange[0] && (c.risk * 100) <= riskRange[1]);
        if (velocityMin !== '' && !isNaN(parseFloat(velocityMin))) {
            list = list.filter(c => c.velocity >= parseFloat(velocityMin));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            let cmp = 0;
            switch (sortBy) {
                case 'urgency': cmp = (a.risk * a.velocity * 10) - (b.risk * b.velocity * 10); break;
                case 'risk': cmp = a.risk - b.risk; break;
                case 'velocity': cmp = a.velocity - b.velocity; break;
                case 'name': cmp = a.name.localeCompare(b.name); break;
                default: cmp = 0;
            }
            return sortDir === 'desc' ? -cmp : cmp;
        });
        return list;
    }, [accounts, tierFilter, diagnosisFilter, riskRange, velocityMin, sortBy, sortDir, searchQuery]);

    const toggleShortlist = (id) => setShortlisted(prev => {
        const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
    });
    const selectAllVisible = () => setShortlisted(prev => { const s = new Set(prev); filteredCustomers.forEach(c => s.add(c.id)); return s; });
    const clearSelection = () => setShortlisted(new Set());

    const handleBatchSend = async () => {
        setBatchSending(true);
        try {
            const promises = [...shortlisted].map(id =>
                addIntervention(id, { type: batchAction, outcome: 'PENDING' }).catch(() => null)
            );
            await Promise.all(promises);
        } catch { /* best-effort */ } finally {
            setBatchSending(false);
            setBatchSent(true);
            setTimeout(() => setBatchSent(false), 3000);
        }
    };

    const shortlistedCustomers = accounts.filter(c => shortlisted.has(c.id));
    const tierCounts = useMemo(() => ({
        all: accounts.length,
        'Tier 3': accounts.filter(c => c.tier === 'Tier 3').length,
        'Tier 2': accounts.filter(c => c.tier === 'Tier 2').length,
        'Tier 1': accounts.filter(c => c.tier === 'Tier 1').length,
    }), [accounts]);

    const batchId = latestBatch?.batchId ?? fallbackBatch.lastBatchId;

    if (apiLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '4rem', alignItems: 'center' }}>
                    <RefreshCcw size={24} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                    <span className="mono text-dim" style={{ fontSize: '0.75rem' }}>LOADING_INTERVENTION_QUEUE...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>Action Matrix</h1>
                        <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>LOAN_ACCOUNTS // FILTER_SHORTLIST_BATCH</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {apiError && <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--tier-2)' }}>OFFLINE_MODE</span>}
                        <button onClick={fetchData} className="mono" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '0.4rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <RefreshCcw size={10} /> SYNC
                        </button>
                        <div className="glass" style={{ padding: '0.4rem 0.8rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '220px' }}>
                            <Search size={13} className="text-dim" />
                            <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="mono" style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '0.7rem', width: '100%' }} />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className="mono"
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', background: showFilters ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)', color: showFilters ? 'black' : 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Filter size={12} /> FILTERS
                        </button>
                    </div>
                </div>
            </header>

            {/* Tier Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {['all', 'Tier 3', 'Tier 2', 'Tier 1'].map(t => (
                    <button key={t} onClick={() => setTierFilter(t)} className="mono"
                        style={{
                            padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800,
                            background: tierFilter === t ? (t === 'Tier 3' ? 'var(--tier-3-soft)' : t === 'Tier 2' ? 'var(--tier-2-soft)' : t === 'Tier 1' ? 'var(--tier-1-soft)' : 'var(--primary)') : 'rgba(255,255,255,0.02)',
                            border: tierFilter === t ? (t === 'Tier 3' ? '1px solid var(--tier-3)' : t === 'Tier 2' ? '1px solid var(--tier-2)' : t === 'Tier 1' ? '1px solid var(--tier-1)' : '1px solid var(--primary)') : '1px solid var(--border)',
                            color: tierFilter === t ? (t === 'Tier 3' ? 'var(--tier-3)' : t === 'Tier 2' ? 'var(--tier-2)' : t === 'Tier 1' ? 'var(--tier-1)' : 'black') : 'var(--text-dim)',
                        }}>
                        {t === 'all' ? 'ALL' : t.toUpperCase()} ({tierCounts[t]})
                    </button>
                ))}
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: '1rem' }}>
                        <div className="technical-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', padding: '1.25rem' }}>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Diagnosis</label>
                                <select value={diagnosisFilter} onChange={e => setDiagnosisFilter(e.target.value)} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    <option value="all">ALL_DIAGNOSES</option>
                                    {allDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Min Risk Score (%)</label>
                                <input type="number" min={0} max={100} value={riskRange[0]} onChange={e => setRiskRange([+e.target.value, riskRange[1]])} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.7rem' }} />
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Max Risk Score (%)</label>
                                <input type="number" min={0} max={100} value={riskRange[1]} onChange={e => setRiskRange([riskRange[0], +e.target.value])} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.7rem' }} />
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Min Velocity (dS/dt)</label>
                                <input type="number" step="0.01" value={velocityMin} onChange={e => setVelocityMin(e.target.value)} placeholder="e.g. 0.05" className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.7rem' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="content-grid" style={{ gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                <main className="main-column">
                    {/* Sort bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="mono text-dim" style={{ fontSize: '0.6rem' }}>SORT:</span>
                            {[{ key: 'urgency', label: 'URGENCY' }, { key: 'risk', label: 'RISK' }, { key: 'velocity', label: 'VELOCITY' }, { key: 'name', label: 'NAME' }].map(s => (
                                <button key={s.key} onClick={() => { if (sortBy === s.key) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(s.key); setSortDir('desc'); } }}
                                    className="mono" style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 700, background: sortBy === s.key ? 'rgba(56,189,248,0.1)' : 'transparent', border: sortBy === s.key ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent', color: sortBy === s.key ? 'var(--primary)' : 'var(--text-dim)' }}>
                                    {s.label} {sortBy === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={selectAllVisible} className="mono" style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--tier-1)' }}>
                                SELECT ALL ({filteredCustomers.length})
                            </button>
                            {shortlisted.size > 0 && (
                                <button onClick={clearSelection} className="mono" style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 700, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--tier-3)' }}>
                                    CLEAR ({shortlisted.size})
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="technical-card" style={{ padding: 0, maxHeight: '55vh', overflowY: 'auto' }}>
                        <table className="institutional-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 30 }}></th>
                                    <th>Loan Account</th>
                                    <th>Risk Score</th>
                                    <th>Urgency</th>
                                    <th>Diagnosis</th>
                                    <th>Tier</th>
                                    <th>Velocity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(c => {
                                    const isSelected = shortlisted.has(c.id);
                                    const urgency = (c.risk * c.velocity * 10).toFixed(2);
                                    return (
                                        <tr key={c.id} style={{ cursor: 'pointer', background: isSelected ? 'rgba(56,189,248,0.04)' : 'transparent' }} onClick={() => toggleShortlist(c.id)}>
                                            <td>
                                                <div style={{ width: 16, height: 16, borderRadius: '3px', border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {isSelected && <Check size={10} color="black" strokeWidth={3} />}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{c.name}</div>
                                                <div className="mono text-dim" style={{ fontSize: '0.55rem' }}>{c.loanAccountId ?? c.id}</div>
                                            </td>
                                            <td className="mono" style={{ fontWeight: 900, fontSize: '0.9rem' }}>{(c.risk * 100).toFixed(1)}%</td>
                                            <td>
                                                <div className="mono" style={{ fontWeight: 900, fontSize: '0.85rem', color: parseFloat(urgency) > 0.5 ? 'var(--tier-3)' : parseFloat(urgency) > 0.2 ? 'var(--tier-2)' : 'var(--tier-1)' }}>
                                                    {urgency}U
                                                </div>
                                            </td>
                                            <td><div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{c.diagnosis}</div></td>
                                            <td><span className={`tier-tag ${c.tier.toLowerCase().replace(' ', '')}`}>{c.tier}</span></td>
                                            <td className={c.velocity > 0 ? 'text-red' : 'text-green'}>
                                                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.velocity > 0 ? '▲' : '▼'} {c.velocity}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredCustomers.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <div className="mono text-dim" style={{ fontSize: '0.75rem' }}>NO_ACCOUNTS_MATCH_FILTERS</div>
                            </div>
                        )}
                    </div>

                    <div className="mono text-dim" style={{ fontSize: '0.6rem', marginTop: '0.5rem', textAlign: 'right' }}>
                        Showing {filteredCustomers.length} of {accounts.length} monitored loan accounts
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <div className="sidebar-section" style={{ marginBottom: '1rem' }}>Support Protocol Matrix</div>
                        <DecisionMatrix compact />
                    </div>
                </main>

                <aside className="side-column">
                    {/* Batch Panel */}
                    <div className="technical-card" style={{ background: shortlisted.size > 0 ? 'rgba(56,189,248,0.03)' : 'rgba(0,0,0,0.1)', borderColor: shortlisted.size > 0 ? 'rgba(56,189,248,0.2)' : 'var(--border)', transition: 'all 0.3s' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <Users size={16} className="text-primary" />
                            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 900 }}>BATCH_PROCESSOR</span>
                            {shortlisted.size > 0 && <span className="mono" style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', marginLeft: 'auto' }}>{shortlisted.size} SELECTED</span>}
                        </div>

                        {shortlisted.size === 0 ? (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>Select loan accounts from the table to shortlist them for batch intervention. Interventions are saved to MongoDB.</p>
                        ) : (
                            <>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem' }}>
                                    {shortlistedCustomers.map(c => (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.7rem' }}>
                                            <div><span style={{ fontWeight: 700 }}>{c.name}</span><span className="mono text-dim" style={{ fontSize: '0.55rem', marginLeft: '0.5rem' }}>{(c.risk * 100).toFixed(0)}%</span></div>
                                            <button onClick={(e) => { e.stopPropagation(); toggleShortlist(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}><X size={12} className="text-dim" /></button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Batch Action</label>
                                    <select value={batchAction} onChange={e => setBatchAction(e.target.value)} className="mono"
                                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                        <option value="RM_CALL">RM_CALL — Crisis Contact</option>
                                        <option value="SMS_NUDGE">SMS_NUDGE — AI Text</option>
                                        <option value="WHATSAPP_NUDGE">WHATSAPP — WhatsApp Alert</option>
                                        <option value="EMAIL_ALERT">EMAIL — Alert Notification</option>
                                        <option value="EMI_HOLIDAY_OFFER">EMI_HOLIDAY — 30-Day Pause</option>
                                        <option value="AUTO_RESTRUCTURE_OFFER">RESTRUCTURE — Loan Restructuring</option>
                                    </select>
                                </div>
                                <button onClick={handleBatchSend} disabled={batchSending || batchSent} className="mono"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', background: batchSent ? 'var(--tier-1)' : batchSending ? 'var(--bg-surface)' : 'var(--primary)', border: 'none', color: batchSent ? 'white' : 'black', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s' }}>
                                    {batchSent ? <><Check size={14} /> BATCH DISPATCHED</> : batchSending ? <><RefreshCcw size={14} style={{ animation: 'spin 1s linear infinite' }} /> SAVING TO DB...</> : <><Send size={14} /> DISPATCH BATCH ({shortlisted.size})</>}
                                </button>
                            </>
                        )}
                    </div>

                    {/* T3 Protocol */}
                    <div className="technical-card" style={{ background: 'rgba(244,63,94,0.03)', borderColor: 'rgba(244,63,94,0.2)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <ShieldAlert size={16} className="text-red" />
                            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--tier-3)' }}>T3_PROTOCOL_BRIEF</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div className="stat-label" style={{ fontSize: '0.55rem', color: 'white', marginBottom: '0.25rem' }}>Threshold</div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>Urgency &gt; 1.0U requires mandatory RM contact within 4 hours. Interventions are logged to MongoDB on dispatch.</p>
                            </div>
                        </div>
                    </div>

                    {/* Queue Summary */}
                    <div className="technical-card">
                        <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem' }}>Queue Summary</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Filtered Results', val: filteredCustomers.length, color: 'var(--primary)' },
                                { label: 'T3 Critical', val: tierCounts['Tier 3'], color: 'var(--tier-3)' },
                                { label: 'T2 Warning', val: tierCounts['Tier 2'], color: 'var(--tier-2)' },
                                { label: 'T1 Watch', val: tierCounts['Tier 1'], color: 'var(--tier-1)' },
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono text-dim" style={{ fontSize: '0.6rem' }}>{s.label}</span>
                                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color }}>{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="technical-card glass" style={{ borderColor: 'var(--text-dim)', opacity: 0.6 }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
                            Data from batch <span className="mono" style={{ color: 'white' }}>{batchId}</span>.<br />Interventions are persisted to MongoDB in real-time.
                        </p>
                    </div>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.tier-tag { font-size: 0.55rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 900; display: inline-block; text-transform: uppercase; border: 1px solid transparent; } .tier-tag.tier3 { background: var(--tier-3-soft); color: var(--tier-3); border-color: rgba(244,63,94,0.2); } .tier-tag.tier2 { background: var(--tier-2-soft); color: var(--tier-2); border-color: rgba(251,191,36,0.2); } .tier-tag.tier1 { background: var(--tier-1-soft); color: var(--tier-1); border-color: rgba(16,185,129,0.2); } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }` }} />
        </motion.div>
    );
};

export default InterventionQueue;
