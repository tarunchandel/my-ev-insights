import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Zap, Activity, Coins, Navigation, ChevronDown,
    TrendingDown, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';

const Dashboard = () => {
    const { stats, charges, settings } = useApp();
    const [expandedBars, setExpandedBars] = useState({});
    const navigate = useNavigate();

    const CUR = settings.currency || '₹';
    const UNIT = (settings.distanceUnit || 'km').toUpperCase();
    const efficiency = stats.totalKms > 0 ? (stats.totalSpent / stats.totalKms) : 0;

    // Toggle single bar expansion
    const toggleBar = (id) => {
        setExpandedBars((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Toggle all bars
    const areAllExpanded = useMemo(() => {
        return ['spent', 'distance', 'costPerKm', 'range100'].every(id => expandedBars[id]);
    }, [expandedBars]);

    const toggleAllBars = () => {
        if (areAllExpanded) {
            setExpandedBars({});
        } else {
            setExpandedBars({
                spent: true,
                distance: true,
                costPerKm: true,
                range100: true,
            });
        }
    };

    // --- Calculated Totals ---
    const totals = useMemo(() => {
        const acc = charges.reduce((sum, c) => ({
            km: sum.km + (parseFloat(c.drivenKm) || 0),
            pct: sum.pct + ((parseFloat(c.batteryPct) || 0) - (parseFloat(c.startPct) || 0)),
            kwh: sum.kwh + (parseFloat(c.units) || 0),
            cost: sum.cost + (parseFloat(c.cost) || 0),
        }), { km: 0, pct: 0, kwh: 0, cost: 0 });

        return {
            km: acc.km || 1,
            pct: acc.pct || 1,
            kwh: acc.kwh || 1,
            cost: acc.cost || 1,
            rawKm: acc.km,
            rawPct: acc.pct,
            rawKwh: acc.kwh,
            rawCost: acc.cost,
        };
    }, [charges]);

    // --- Avg Range for 100% charge ---
    const avgRange100 = useMemo(() => {
        const raw = charges.reduce((acc, c) => ({
            km: acc.km + (parseFloat(c.drivenKm) || 0),
            pct: acc.pct + ((parseFloat(c.batteryPct) || 0) - (parseFloat(c.startPct) || 0)),
        }), { km: 0, pct: 0 });
        return raw.pct > 0 ? ((raw.km / raw.pct) * 100) : 0;
    }, [charges]);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        const sorted = [...charges].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return sorted.map(c => {
            const eff = c.drivenKm > 0 && c.units > 0 ? (c.drivenKm / c.units) : 0;
            const costEff = c.drivenKm > 0 ? (c.cost / c.drivenKm) : 0;
            return {
                date: new Date(c.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                cost: Number(c.cost || 0),
                km: Number(c.drivenKm || 0),
                eff: Number(eff.toFixed(1)),
                costEff: Number(costEff.toFixed(2)),
            };
        });
    }, [charges]);

    const tooltipStyle = {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        fontSize: '11px',
        color: '#ffffff',
        padding: '8px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    };

    // Sub-tile helper component with high-contrast, crisp typography and clear backgrounds
    const StatTile = ({ label, value, unit, highlight = false, accentColor = '#38bdf8', bgBorder = 'rgba(255,255,255,0.15)' }) => (
        <div
            className="flex flex-col justify-center items-center text-center transition-all"
            style={{
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderColor: highlight ? accentColor : bgBorder,
                borderWidth: '1px',
                borderStyle: 'solid',
                padding: '0.85rem 0.5rem',
                minHeight: '82px',
                borderRadius: '16px',
                boxShadow: highlight ? `0 0 16px -2px ${accentColor}35` : '0 2px 8px rgba(0,0,0,0.25)',
            }}
        >
            <div style={{
                fontSize: 'clamp(1.2rem, 4vw, 1.55rem)',
                fontWeight: 800,
                color: accentColor,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#e2e8f0',
                marginTop: '5px',
                lineHeight: 1.2,
            }}>
                {label} {unit && <span style={{ color: '#94a3b8', fontWeight: 600 }}>({unit})</span>}
            </div>
        </div>
    );

    // Definition of the 4 Stacked Horizontal Bars with vibrant, high-contrast themes
    const bars = [
        {
            id: 'spent',
            title: 'Money Spent',
            subLabel: 'Total Till Date',
            value: `${CUR}${stats.totalSpent.toLocaleString()}`,
            unit: null,
            icon: Coins,
            themeColor: '#38bdf8',
            bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.14))',
            borderColor: 'rgba(56, 189, 248, 0.45)',
            activeGlow: '0 0 28px -2px rgba(56, 189, 248, 0.4)',
            renderExpanded: () => (
                <div className="flex flex-col gap-4 pt-4">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatTile
                            label={`Cost / ${UNIT}`}
                            value={`${CUR}${(totals.cost / totals.km).toFixed(2)}`}
                            highlight
                            accentColor="#38bdf8"
                            bgBorder="rgba(56, 189, 248, 0.3)"
                        />
                        <StatTile
                            label="Cost / %"
                            value={`${CUR}${(totals.cost / totals.pct).toFixed(2)}`}
                            accentColor="#a5b4fc"
                            bgBorder="rgba(165, 180, 252, 0.25)"
                        />
                        <StatTile
                            label="Unit Cost"
                            value={`${CUR}${(totals.cost / totals.kwh).toFixed(2)}`}
                            unit={`${CUR}/kWh`}
                            accentColor="#38bdf8"
                            bgBorder="rgba(56, 189, 248, 0.3)"
                        />
                    </div>

                    {/* Cost Chart */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'rgba(15, 23, 42, 0.65)',
                            borderColor: 'rgba(56, 189, 248, 0.3)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
                                Spending History ({CUR})
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800 }}>
                                {charges.length > 0 ? `Avg: ${CUR}${(stats.totalSpent / charges.length).toFixed(0)}/session` : ''}
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '155px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#64748b" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${CUR}${v}`} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${CUR}${val}`, 'Cost']} />
                                        <Bar dataKey="cost" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '155px', color: '#94a3b8' }}>No spending data yet 📊</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'distance',
            title: 'Distance Travelled',
            subLabel: 'Total Till Date',
            value: `${stats.totalKms.toLocaleString()}`,
            unit: UNIT,
            icon: Activity,
            themeColor: '#34d399',
            bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(20, 184, 166, 0.14))',
            borderColor: 'rgba(16, 185, 129, 0.45)',
            activeGlow: '0 0 28px -2px rgba(16, 185, 129, 0.4)',
            renderExpanded: () => (
                <div className="flex flex-col gap-4 pt-4">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatTile
                            label="Total Energy"
                            value={`${stats.totalUnits.toFixed(1)}`}
                            unit="kWh"
                            highlight
                            accentColor="#34d399"
                            bgBorder="rgba(52, 211, 153, 0.3)"
                        />
                        <StatTile
                            label={`Energy / ${UNIT}`}
                            value={`${(totals.kwh / totals.km).toFixed(2)}`}
                            unit={`kWh/${UNIT}`}
                            accentColor="#6ee7b7"
                            bgBorder="rgba(110, 231, 183, 0.25)"
                        />
                        <StatTile
                            label={`Drop / ${UNIT}`}
                            value={`${(totals.pct / totals.km).toFixed(2)}%`}
                            unit={`%/${UNIT}`}
                            accentColor="#34d399"
                            bgBorder="rgba(52, 211, 153, 0.3)"
                        />
                    </div>

                    {/* Trip & Energy Summary Card */}
                    <div
                        className="p-4 rounded-2xl flex justify-between items-center"
                        style={{
                            background: 'rgba(15, 23, 42, 0.65)',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex flex-col">
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cbd5e1', fontWeight: 700 }}>
                                Avg Logged per Session
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
                                {charges.length > 0 ? (totals.rawKm / charges.length).toFixed(1) : 0} {UNIT}
                            </span>
                        </div>
                        <div className="text-right flex flex-col">
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cbd5e1', fontWeight: 700 }}>
                                Logged Distance Sum
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                                {totals.rawKm.toLocaleString()} {UNIT}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'costPerKm',
            title: 'Average Rupee / KM',
            subLabel: 'Running Cost Efficiency',
            value: `${CUR}${efficiency.toFixed(2)}`,
            unit: `/${UNIT}`,
            icon: TrendingDown,
            themeColor: '#fbbf24',
            bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(239, 68, 68, 0.14))',
            borderColor: 'rgba(245, 158, 11, 0.45)',
            activeGlow: '0 0 28px -2px rgba(245, 158, 11, 0.4)',
            renderExpanded: () => (
                <div className="flex flex-col gap-4 pt-4">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatTile
                            label={`${UNIT} / ${CUR}`}
                            value={`${(totals.km / totals.cost).toFixed(2)}`}
                            unit={`${UNIT}/${CUR}`}
                            highlight
                            accentColor="#fbbf24"
                            bgBorder="rgba(251, 191, 36, 0.3)"
                        />
                        <StatTile
                            label={`kWh / ${CUR}`}
                            value={`${(totals.kwh / totals.cost).toFixed(2)}`}
                            unit={`kWh/${CUR}`}
                            accentColor="#fde047"
                            bgBorder="rgba(253, 224, 71, 0.25)"
                        />
                        <StatTile
                            label={`Drop / ${CUR}`}
                            value={`${(totals.pct / totals.cost).toFixed(2)}%`}
                            unit={`%/${CUR}`}
                            accentColor="#fbbf24"
                            bgBorder="rgba(251, 191, 36, 0.3)"
                        />
                    </div>

                    {/* Cost Efficiency Chart */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'rgba(15, 23, 42, 0.65)',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
                                Cost / {UNIT} History ({CUR}/{UNIT})
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800 }}>
                                Lifetime: {CUR}{efficiency.toFixed(2)}/{UNIT}
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '155px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#64748b" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${CUR}${val}/${UNIT}`, 'Cost/KM']} />
                                        <Area type="monotone" dataKey="costEff" stroke="#fbbf24" fill="rgba(245, 158, 11, 0.3)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '155px', color: '#94a3b8' }}>No cost data yet 🚗</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'range100',
            title: 'Range @ 100% Battery',
            subLabel: 'Estimated Full Range',
            value: `${avgRange100.toFixed(0)}`,
            unit: UNIT,
            icon: Navigation,
            themeColor: '#22d3ee',
            bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(59, 130, 246, 0.14))',
            borderColor: 'rgba(6, 182, 212, 0.45)',
            activeGlow: '0 0 28px -2px rgba(6, 182, 212, 0.4)',
            renderExpanded: () => (
                <div className="flex flex-col gap-4 pt-4">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatTile
                            label="Range / %"
                            value={`${(totals.km / totals.pct).toFixed(2)}`}
                            unit={`${UNIT}/%`}
                            highlight
                            accentColor="#22d3ee"
                            bgBorder="rgba(34, 211, 238, 0.3)"
                        />
                        <StatTile
                            label="Range / kWh"
                            value={`${(totals.km / totals.kwh).toFixed(2)}`}
                            unit={`${UNIT}/kWh`}
                            accentColor="#67e8f9"
                            bgBorder="rgba(103, 232, 249, 0.25)"
                        />
                        <StatTile
                            label="Capacity"
                            value={`${(totals.kwh / totals.pct).toFixed(2)}`}
                            unit="kWh/%"
                            accentColor="#22d3ee"
                            bgBorder="rgba(34, 211, 238, 0.3)"
                        />
                    </div>

                    {/* Efficiency Chart */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'rgba(15, 23, 42, 0.65)',
                            borderColor: 'rgba(6, 182, 212, 0.3)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
                                Real-World Efficiency ({UNIT}/kWh)
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: 800 }}>
                                Trend
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '155px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#64748b" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} ${UNIT}/kWh`, 'Efficiency']} />
                                        <Area type="monotone" dataKey="eff" stroke="#06b6d4" fill="rgba(6, 182, 212, 0.3)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '155px', color: '#94a3b8' }}>No range data yet 🌱</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* ── Page Header: Dashboard & Insights directly + Aligned Action Buttons ── */}
            <header className="flex justify-between items-center px-1 pb-1">
                <div>
                    <h1 style={{ fontSize: 'clamp(1.4rem, 4.6vw, 1.95rem)', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)' }}>
                        Dashboard & Insights
                    </h1>
                    {settings.carName && (
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.85 }}>
                            {settings.carName}
                        </p>
                    )}
                </div>

                {/* Right controls: Session Count Badge & Expand/Collapse All */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={toggleAllBars}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            minHeight: '36px',
                        }}
                        title={areAllExpanded ? 'Collapse All' : 'Expand All'}
                    >
                        <Layers size={14} style={{ color: 'var(--color-primary)' }} />
                        <span style={{
                            fontSize: 'clamp(0.72rem, 2.3vw, 0.8rem)',
                            fontWeight: 700,
                        }}>
                            {areAllExpanded ? 'Collapse All' : 'Expand All'}
                        </span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => navigate('/charging')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                        style={{
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(16, 185, 129, 0.22))',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            boxShadow: '0 2px 12px -2px rgba(99, 102, 241, 0.25)',
                            cursor: 'pointer',
                            minHeight: '36px',
                        }}
                        title="View charge sessions"
                    >
                        <Zap size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                        <span style={{
                            fontSize: 'clamp(0.74rem, 2.4vw, 0.82rem)',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            color: 'var(--text-primary)'
                        }}>
                            {charges.length} {charges.length === 1 ? 'Session' : 'Sessions'}
                        </span>
                    </motion.button>
                </div>
            </header>

            {/* ── First-time User Onboarding Nudge (if 0 sessions) ── */}
            {charges.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👋</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>Welcome to EV Insights!</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                        Log your first charging session to unlock full analytics.
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="primary-btn"
                        onClick={() => navigate('/charging')}
                        style={{ padding: '8px 20px', fontSize: '0.8rem', minHeight: '38px' }}
                    >
                        ⚡ Log First Charge
                    </motion.button>
                </motion.div>
            )}

            {/* ── 4 Stacked Horizontal Expandable Bars (Taller, spacious, large numbers) ── */}
            <div className="flex flex-col gap-5">
                {bars.map((bar, index) => {
                    const isExpanded = !!expandedBars[bar.id];
                    const Icon = bar.icon;

                    return (
                        <motion.div
                            key={bar.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            className="glass-panel transition-all"
                            style={{
                                background: bar.bgGradient,
                                borderColor: isExpanded ? bar.themeColor : bar.borderColor,
                                borderWidth: '1.5px',
                                boxShadow: isExpanded ? bar.activeGlow : '0 4px 20px -4px rgba(0, 0, 0, 0.2)',
                                padding: '1.25rem 1.35rem',
                                borderRadius: '22px',
                            }}
                        >
                            {/* ── Bar Header (Clickable to Toggle Accordion, 50%+ Taller) ── */}
                            <div
                                onClick={() => toggleBar(bar.id)}
                                className="flex justify-between items-center cursor-pointer select-none"
                                style={{ minHeight: '92px' }}
                            >
                                {/* Left: Icon + Clean Bold Title & Subtitle */}
                                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                                    <div
                                        style={{
                                            padding: '12px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(15, 23, 42, 0.55)',
                                            border: `1px solid ${bar.borderColor}`,
                                            color: bar.themeColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: `0 2px 10px -2px ${bar.themeColor}33`,
                                        }}
                                    >
                                        <Icon size={22} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span style={{
                                            fontSize: 'clamp(0.82rem, 2.6vw, 0.95rem)',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            color: 'var(--text-primary)',
                                            lineHeight: 1.25,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {bar.title}
                                        </span>
                                        <span style={{
                                            fontSize: 'clamp(0.68rem, 2.1vw, 0.78rem)',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            opacity: 0.85,
                                            lineHeight: 1.2,
                                            marginTop: '3px',
                                        }}>
                                            {bar.subLabel}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Prominent Large Number + Unit + Animated Chevron */}
                                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                                    <div className="flex items-baseline gap-1.5">
                                        <span style={{
                                            fontSize: 'clamp(1.75rem, 6.2vw, 2.45rem)',
                                            fontWeight: 900,
                                            letterSpacing: '-0.03em',
                                            color: bar.themeColor,
                                            lineHeight: 1,
                                        }}>
                                            {bar.value}
                                        </span>
                                        {bar.unit && (
                                            <span style={{
                                                fontSize: 'clamp(0.78rem, 2.5vw, 0.92rem)',
                                                fontWeight: 700,
                                                color: 'var(--text-secondary)',
                                                opacity: 0.9,
                                                textTransform: 'uppercase',
                                            }}>
                                                {bar.unit}
                                            </span>
                                        )}
                                    </div>

                                    {/* Animated Chevron */}
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            color: bar.themeColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.9,
                                            marginLeft: '4px',
                                        }}
                                    >
                                        <ChevronDown size={22} />
                                    </motion.div>
                                </div>
                            </div>

                            {/* ── Expandable Content Area (Sub-stats + Charts) ── */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.12)', margin: '0.85rem 0 0 0' }} />
                                        {bar.renderExpanded()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;

