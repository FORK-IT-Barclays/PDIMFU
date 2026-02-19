import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { portfolioStats as fallbackStats } from '../data/mockData';
import { getPortfolioStats } from '../services/api';
import { Activity, Zap, Shield, AlertCircle, RefreshCcw } from 'lucide-react';

const FleetAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPortfolioStats();
            setStats(res.data);
            setApiError(false);
        } catch {
            setApiError(true);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Use API signal health if available, otherwise fallback
    const signalHealth = (stats?.signalHealth?.length > 0
        ? stats.signalHealth
        : fallbackStats.signalHealth
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1>Portfolio Observatory</h1>
                    <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        LOAN_PORTFOLIO_SIGNALS // BATCH_AGGREGATED_TELEMETRY
                        {apiError && ' // FALLBACK_MODE'}
                    </p>
                </div>
                <button onClick={fetchStats} className="mono" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCcw size={10} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> REFRESH
                </button>
            </header>

            <div className="content-grid" style={{ gridTemplateColumns: '1fr', gap: '2.5rem' }}>
                <section>
                    <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={14} className="text-primary" />
                        Live Signal Monitor
                        {!apiError && <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--tier-1)', marginLeft: 'auto' }}>● LIVE — MongoDB</span>}
                    </div>
                    <div className="heat-map-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {signalHealth.map((s) => (
                            <div key={s.signal} className="technical-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <span className="mono" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}>{s.signal}</span>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: s.status === 'Critical' ? 'var(--tier-3)' : s.status === 'Warning' ? 'var(--tier-2)' : 'var(--tier-1)',
                                        boxShadow: `0 0 10px ${s.status === 'Critical' ? 'var(--tier-3)' : 'transparent'}`
                                    }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{(s.severity * 10).toFixed(1)}</div>
                                    <div className="mono text-dim" style={{ fontSize: '0.7rem' }}>/ 10.0</div>
                                </div>
                                <div className="mono" style={{ fontSize: '0.6rem', marginTop: '0.5rem', color: s.status === 'Critical' ? 'var(--tier-3)' : 'var(--text-dim)', fontWeight: 700 }}>
                                    {s.status.toUpperCase()}
                                </div>
                                {s.avgValue !== undefined && (
                                    <div className="mono text-dim" style={{ fontSize: '0.5rem', marginTop: '0.25rem' }}>
                                        AVG: {Number(s.avgValue).toFixed(3)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <section>
                        <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={14} className="text-primary" />
                            Systemic Correlation Matrix
                        </div>
                        <div className="technical-card" style={{ padding: 0 }}>
                            <table className="institutional-table">
                                <thead>
                                    <tr>
                                        <th>Intersection</th>
                                        <th>Correlation</th>
                                        <th>Impact Delay</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { pair: 'S5_DECAY → S1_DRIFT', corr: '0.84', delay: '8.4D', status: 'CRITICAL', color: 'var(--tier-3)' },
                                        { pair: 'S7 + S2: LIQUIDITY', corr: '0.72', delay: '12.1D', status: 'MONITOR', color: 'var(--tier-2)' },
                                        { pair: 'S4_VEL → T3_EXP', corr: '0.65', delay: '3.2D', status: 'STABLE', color: 'var(--tier-1)' },
                                        { pair: 'S8_FAIL → NPA_RISK', corr: '0.91', delay: '5.7D', status: 'CRITICAL', color: 'var(--tier-3)' },
                                        { pair: 'S3_EXH → S6_EXT', corr: '0.58', delay: '18.3D', status: 'STABLE', color: 'var(--tier-1)' },
                                    ].map((row, i) => (
                                        <tr key={i}>
                                            <td className="mono" style={{ fontWeight: 800, fontSize: '0.75rem' }}>{row.pair}</td>
                                            <td className="mono">{row.corr}</td>
                                            <td className="mono text-dim">{row.delay}</td>
                                            <td><span className="mono" style={{ color: row.color, fontSize: '0.65rem', fontWeight: 800 }}>{row.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Portfolio Snapshot from API */}
                        {stats && (
                            <div className="technical-card" style={{ marginTop: '1.5rem' }}>
                                <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={14} className="text-primary" /> Portfolio Snapshot
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {[
                                        { label: 'Total Accounts', val: stats.total },
                                        { label: 'Avg Risk', val: `${(stats.velocityStats?.avgRisk * 100 || 0).toFixed(1)}%` },
                                        { label: 'Avg Velocity', val: Number(stats.velocityStats?.avgVelocity || 0).toFixed(4) },
                                        { label: 'Tier 3 Count', val: stats.tiers?.['Tier 3']?.count ?? '—', color: 'var(--tier-3)' },
                                        { label: 'Tier 2 Count', val: stats.tiers?.['Tier 2']?.count ?? '—', color: 'var(--tier-2)' },
                                        { label: 'Tier 1 Count', val: stats.tiers?.['Tier 1']?.count ?? '—', color: 'var(--tier-1)' },
                                    ].map((m, i) => (
                                        <div key={i} className="technical-card" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                                            <div className="stat-label" style={{ fontSize: '0.5rem' }}>{m.label}</div>
                                            <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, margin: '0.25rem 0', color: m.color || 'white' }}>{m.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={14} className="text-primary" />
                            Policy Thresholds
                        </div>
                        <div className="technical-card glass" style={{ padding: '1.5rem', borderColor: 'var(--primary-glow)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {[
                                    { label: 'AUTO_INTERVENE', val: '8.5 / 10' },
                                    { label: 'RM_ESCALATION', val: '7.0 / 10' },
                                    { label: 'RE_SCAN_FREQ', val: '6H @ >5.0' },
                                    { label: 'NPA_TRIGGER', val: '90 DPD' },
                                    { label: 'VELOCITY_ALERT', val: '>0.08 dS/dt' },
                                ].map((p, i) => (
                                    <div key={i}>
                                        <div className="stat-label" style={{ fontSize: '0.55rem', marginBottom: '0.25rem' }}>{p.label}</div>
                                        <div className="mono" style={{ fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>{p.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Diagnosis distribution */}
                        {stats?.diagnosisDistribution && (
                            <div className="technical-card" style={{ marginTop: '1rem' }}>
                                <div className="sidebar-section" style={{ padding: 0, marginBottom: '0.75rem' }}>Top Diagnoses</div>
                                {stats.diagnosisDistribution.slice(0, 5).map((d, i) => (
                                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                                            <span className="mono text-dim" style={{ fontSize: '0.55rem' }}>{d.diagnosis}</span>
                                            <span className="mono" style={{ fontSize: '0.55rem', fontWeight: 700 }}>{d.count}</span>
                                        </div>
                                        <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 2 }}>
                                            <div style={{ height: '100%', width: `${(d.count / (stats.total || 1)) * 100}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
    );
};

export default FleetAnalytics;
