import React from 'react';
import { motion } from 'framer-motion';
import { portfolioStats } from '../data/mockData';
import { Activity, Zap, Shield, AlertCircle } from 'lucide-react';

const FleetAnalytics = () => {
    // Grouping signals for better "understanding"
    const behavioralSignals = portfolioStats.signalHealth.slice(0, 4);
    const financialSignals = portfolioStats.signalHealth.slice(4);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1>Portfolio Observatory</h1>
                    <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        LOAN_PORTFOLIO_SIGNALS // BATCH_AGGREGATED_TELEMETRY
                    </p>
                </div>
            </header>

            <div className="content-grid" style={{ gridTemplateColumns: '1fr', gap: '2.5rem' }}>
                <section>
                    <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={14} className="text-primary" />
                        Live Signal Monitor
                    </div>
                    <div className="heat-map-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {portfolioStats.signalHealth.map((s) => (
                            <div key={s.signal} className="technical-card" style={{ padding: '1.5rem', background: 'rgba(255,b,255,0.01)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <span className="mono" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}>{s.signal}</span>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: s.status === 'Critical' ? 'var(--tier-3)' : s.status === 'Warning' ? 'var(--tier-2)' : 'var(--tier-1)',
                                        boxShadow: `0 0 10px ${s.status === 'Critical' ? 'var(--tier-3)' : 'transparent'}`
                                    }}></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{(s.severity * 10).toFixed(1)}</div>
                                    <div className="mono text-dim" style={{ fontSize: '0.7rem' }}>/ 10.0</div>
                                </div>
                                <div className="mono" style={{
                                    fontSize: '0.6rem',
                                    marginTop: '0.5rem',
                                    color: s.status === 'Critical' ? 'var(--tier-3)' : 'var(--text-dim)',
                                    fontWeight: 700
                                }}>
                                    {s.status.toUpperCase()}
                                </div>
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
                                    ].map((row, i) => (
                                        <tr key={i}>
                                            <td className="mono" style={{ fontWeight: 800, fontSize: '0.75rem' }}>{row.pair}</td>
                                            <td className="mono">{row.corr}</td>
                                            <td className="mono text-dim">{row.delay}</td>
                                            <td>
                                                <span className="mono" style={{ color: row.color, fontSize: '0.65rem', fontWeight: 800 }}>{row.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                                ].map((p, i) => (
                                    <div key={i}>
                                        <div className="stat-label" style={{ fontSize: '0.55rem', marginBottom: '0.25rem' }}>{p.label}</div>
                                        <div className="mono" style={{ fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>{p.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>
    );
};

export default FleetAnalytics;
