import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Activity, ShieldCheck, Info, Radio, Zap, CheckCircle2 } from 'lucide-react';

const scenarios = [
    { id: 'SCN_01', name: 'CRISIS SPIRAL', risk: '>0.6', velocity: '>0.1', accel: '>0.008', diagnosis: 'SPIRAL', tier: 'T3', urgency: 'CRIT', action: 'Direct RM Intervention', color: 'var(--tier-3)' },
    { id: 'SCN_02', name: 'HIDDEN ACCEL', risk: '<0.6', velocity: '>0.1', accel: '>0.008', diagnosis: 'ACCEL', tier: 'T3', urgency: 'HIGH', action: 'Pre-emptive SMS/Call', color: 'var(--tier-3)' },
    { id: 'SCN_03', name: 'MANAGED DECLINE', risk: '>0.6', velocity: '>0.1', accel: '≈0', diagnosis: 'DECLINE', tier: 'T2', urgency: 'MED', action: 'Schedule Restructuring', color: 'var(--tier-2)' },
    { id: 'SCN_04', name: 'STABLE RISK', risk: '>0.6', velocity: 'STABLE', accel: 'STABLE', diagnosis: 'STATIC', tier: 'T2', urgency: 'MED', action: 'Watchlist Inclusion', color: 'var(--tier-2)' },
    { id: 'SCN_05', name: 'EARLY WARNING', risk: '<0.6', velocity: '>0.1', accel: '≈0', diagnosis: 'E_WARN', tier: 'T1', urgency: 'LOW', action: 'Automated Nudge', color: 'var(--tier-1)' },
];

const DecisionMatrix = ({ compact }) => {
    return (
        <div className="technical-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="institutional-table">
                <thead>
                    <tr>
                        <th>CODE</th>
                        <th>S_RISK</th>
                        <th>V_VELOCITY</th>
                        <th>A_ACCEL</th>
                        <th>DIAGNOSIS</th>
                        <th>TIER</th>
                        <th>PROTOCOL</th>
                    </tr>
                </thead>
                <tbody>
                    {scenarios.map((s, i) => (
                        <tr key={s.id} className="mono" style={{ fontSize: '0.75rem' }}>
                            <td className="text-dim">{s.id}</td>
                            <td>{s.risk}</td>
                            <td>{s.velocity}</td>
                            <td>{s.accel}</td>
                            <td style={{ color: s.color, fontWeight: 800 }}>{s.diagnosis}</td>
                            <td><span className={`tier-tag ${s.tier.toLowerCase()}`}>{s.tier}</span></td>
                            <td className="text-dim" style={{ fontSize: '0.65rem' }}>{s.action.toUpperCase()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <style dangerouslySetInnerHTML={{
                __html: `
                .tier-tag.t3 { color: var(--tier-3); background: var(--tier-3-soft); padding: 0.1rem 0.4rem; border-radius: 3px; }
                .tier-tag.t2 { color: var(--tier-2); background: var(--tier-2-soft); padding: 0.1rem 0.4rem; border-radius: 3px; }
                .tier-tag.t1 { color: var(--tier-1); background: var(--tier-1-soft); padding: 0.1rem 0.4rem; border-radius: 3px; }
            `}} />
        </div>
    );
};

export default DecisionMatrix;
