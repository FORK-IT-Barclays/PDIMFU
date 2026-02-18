import React from 'react';
import { motion } from 'framer-motion';
import { Database, Cpu, Layers, Share2, Server } from 'lucide-react';

const DataNucleus = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1>Architecture Nucleus</h1>
                    <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        LOAN_ACCOUNTS_ONLY // BATCH_INGESTION_AND_PROCESSING
                    </p>
                </div>
            </header>

            <div className="content-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem' }}>
                <main className="main-column">
                    <section>
                        <div className="sidebar-section">01 // Ingestion Architecture (Loan Accounts Only)</div>
                        <p className="mono text-dim" style={{ fontSize: '0.65rem', marginBottom: '1rem', lineHeight: 1.4 }}>Only accounts with an active or closed loan are ingested. Data is pulled in batches (e.g. 5K accounts per batch).</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {[
                                { name: 'Home Credit', type: 'Primary Training', signals: 'S1, S2, S3, S6, S8' },
                                { name: 'BankSim', type: 'Behavioral Library', signals: 'S4, S7' },
                                { name: 'NeurIPS BAF', type: 'Engagement Decay', signals: 'S5' },
                                { name: 'Institutional DB', type: 'Label Master', signals: 'Target_V' },
                            ].map((s, i) => (
                                <div key={i} className="technical-card" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <Database size={16} className="text-dim" />
                                        <div>
                                            <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 800 }}>{s.name.toUpperCase()}</div>
                                            <div className="mono text-dim" style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>{s.type}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                        <div className="stat-label" style={{ fontSize: '0.5rem' }}>Active Signals</div>
                                        <div className="mono text-primary" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>{s.signals}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="sidebar-section">02 // Batch Processing Manifold</div>
                        <div className="technical-card glass" style={{ padding: '2.5rem', textAlign: 'center', borderColor: 'var(--primary)' }}>
                            <Cpu size={32} className="text-primary pulse-subtle" style={{ marginBottom: '1rem' }} />
                            <h3 className="mono" style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>VECTOR_CORE_FUSION_V4</h3>
                            <p className="mono text-dim" style={{ fontSize: '0.65rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                                Per-batch: ingest loan accounts → compute S/V/A and Octet signals → apply Decision Matrix → persist. No real-time streaming.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem' }}>
                                <div>
                                    <div className="stat-label" style={{ fontSize: '0.55rem' }}>Model Reliability</div>
                                    <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 800 }}>98.4%</div>
                                </div>
                                <div>
                                    <div className="stat-label" style={{ fontSize: '0.55rem' }}>Latency</div>
                                    <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 800 }}>14ms</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <aside className="side-column">
                    <section>
                        <div className="sidebar-section">Routing Nodes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'KINETIC_SCORE', icon: Server, desc: 'L1 Decision Engine' },
                                { label: 'ACTION_ROUTER', icon: Share2, desc: 'Tiered Intervention' },
                                { label: 'DOSSIER_GEN', icon: Layers, desc: 'RM Intelligence API' },
                            ].map((node, i) => (
                                <div key={i} className="technical-card" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <node.icon size={18} className="text-primary" />
                                        <div>
                                            <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 800 }}>{node.label}</div>
                                            <div className="mono text-dim" style={{ fontSize: '0.6rem' }}>{node.desc}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="technical-card glass" style={{ borderColor: 'var(--primary-glow)' }}>
                            <div className="stat-label" style={{ fontSize: '0.6rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Schema Status</div>
                            <div className="mono text-dim" style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                                Protocol GOLDEN_RECORD active. All nodes synchronized to Epoch 882.
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </motion.div>
    );
};

export default DataNucleus;
