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
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '10px',
        fontSize: '11px',
        color: '#fff',
        padding: '6px 10px',
    };

    // Sub-tile helper component
    const StatTile = ({ label, value, unit, highlight = false, accentColor = 'var(--text-primary)' }) => (
        <div
            className="glass-panel flex flex-col justify-center items-center text-center"
            style={{
                background: 'rgba(0, 0, 0, 0.15)',
                borderColor: highlight ? 'var(--glass-shine)' : 'rgba(255, 255, 255, 0.08)',
                borderWidth: '1px',
                padding: '0.5rem 0.35rem',
                minHeight: '62px',
            }}
        >
            <div style={{
                fontSize: 'clamp(0.95rem, 3.2vw, 1.25rem)',
                fontWeight: 800,
                color: accentColor,
                lineHeight: 1.1,
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-secondary)',
                marginTop: '3px',
                opacity: 0.85,
            }}>
                {label} {unit && <span style={{ opacity: 0.65 }}>({unit})</span>}
            </div>
        </div>
    );

    // Definition of the 4 Stacked Horizontal Bars
    const bars = [
        {
            id: 'spent',
            title: 'Money Spent',
            subLabel: 'Till Date',
            value: `${CUR}${stats.totalSpent.toLocaleString()}`,
            unit: null,
            icon: Coins,
            themeColor: '#60a5fa',
            bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(139, 92, 246, 0.12))',
            borderColor: 'rgba(59, 130, 246, 0.35)',
            activeGlow: '0 0 20px -3px rgba(59, 130, 246, 0.3)',
            renderExpanded: () => (
                <div className="flex flex-col gap-3 pt-3">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <StatTile
                            label={`Cost / ${UNIT}`}
                            value={`${CUR}${(totals.cost / totals.km).toFixed(2)}`}
                            highlight
                            accentColor="#93c5fd"
                        />
                        <StatTile
                            label="Cost / %"
                            value={`${CUR}${(totals.cost / totals.pct).toFixed(2)}`}
                            accentColor="#bfdbfe"
                        />
                        <StatTile
                            label="Unit Cost"
                            value={`${CUR}${(totals.cost / totals.kwh).toFixed(2)}`}
                            unit={`${CUR}/kWh`}
                            accentColor="#93c5fd"
                        />
                    </div>

                    {/* Cost Chart */}
                    <div
                        className="glass-panel p-3"
                        style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Spending History ({CUR})
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#93c5fd', fontWeight: 600 }}>
                                {charges.length > 0 ? `Avg: ${CUR}${(stats.totalSpent / charges.length).toFixed(0)}/session` : ''}
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '140px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${CUR}${v}`} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${CUR}${val}`, 'Cost']} />
                                        <Bar dataKey="cost" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '140px' }}>No spending data yet 📊</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'distance',
            title: 'Distance Travelled',
            subLabel: 'Till Date',
            value: `${stats.totalKms.toLocaleString()}`,
            unit: UNIT,
            icon: Activity,
            themeColor: '#34d399',
            bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(20, 184, 166, 0.12))',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            activeGlow: '0 0 20px -3px rgba(16, 185, 129, 0.3)',
            renderExpanded: () => (
                <div className="flex flex-col gap-3 pt-3">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <StatTile
                            label="Total Energy"
                            value={`${stats.totalUnits.toFixed(1)}`}
                            unit="kWh"
                            highlight
                            accentColor="#6ee7b7"
                        />
                        <StatTile
                            label={`Energy / ${UNIT}`}
                            value={`${(totals.kwh / totals.km).toFixed(2)}`}
                            unit={`kWh/${UNIT}`}
                            accentColor="#a7f3d0"
                        />
                        <StatTile
                            label={`Drop / ${UNIT}`}
                            value={`${(totals.pct / totals.km).toFixed(2)}%`}
                            unit={`%/${UNIT}`}
                            accentColor="#6ee7b7"
                        />
                    </div>

                    {/* Trip & Energy Summary Card */}
                    <div
                        className="glass-panel p-3 flex justify-between items-center"
                        style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                    >
                        <div className="flex flex-col">
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Avg Logged per Session
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {charges.length > 0 ? (totals.rawKm / charges.length).toFixed(1) : 0} {UNIT}
                            </span>
                        </div>
                        <div className="text-right flex flex-col">
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Logged Distance Sum
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
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
            subLabel: 'Running Cost',
            value: `${CUR}${efficiency.toFixed(2)}`,
            unit: `/${UNIT}`,
            icon: TrendingDown,
            themeColor: '#fbbf24',
            bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(239, 68, 68, 0.12))',
            borderColor: 'rgba(245, 158, 11, 0.35)',
            activeGlow: '0 0 20px -3px rgba(245, 158, 11, 0.3)',
            renderExpanded: () => (
                <div className="flex flex-col gap-3 pt-3">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <StatTile
                            label={`${UNIT} / ${CUR}`}
                            value={`${(totals.km / totals.cost).toFixed(2)}`}
                            unit={`${UNIT}/${CUR}`}
                            highlight
                            accentColor="#fde68a"
                        />
                        <StatTile
                            label={`kWh / ${CUR}`}
                            value={`${(totals.kwh / totals.cost).toFixed(2)}`}
                            unit={`kWh/${CUR}`}
                            accentColor="#fef08a"
                        />
                        <StatTile
                            label={`Drop / ${CUR}`}
                            value={`${(totals.pct / totals.cost).toFixed(2)}%`}
                            unit={`%/${CUR}`}
                            accentColor="#fde68a"
                        />
                    </div>

                    {/* Cost Efficiency Chart */}
                    <div
                        className="glass-panel p-3"
                        style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                    >
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Cost / {UNIT} History ({CUR}/{UNIT})
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 600 }}>
                                Lifetime: {CUR}{efficiency.toFixed(2)}/{UNIT}
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '140px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${CUR}${val}/${UNIT}`, 'Cost/KM']} />
                                        <Area type="monotone" dataKey="costEff" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.2)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '140px' }}>No cost data yet 🚗</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'range100',
            title: 'Range @ 100% Battery',
            subLabel: 'Full Charge Range',
            value: `${avgRange100.toFixed(0)}`,
            unit: UNIT,
            icon: Navigation,
            themeColor: '#22d3ee',
            bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(59, 130, 246, 0.12))',
            borderColor: 'rgba(6, 182, 212, 0.35)',
            activeGlow: '0 0 20px -3px rgba(6, 182, 212, 0.3)',
            renderExpanded: () => (
                <div className="flex flex-col gap-3 pt-3">
                    {/* Sub-stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <StatTile
                            label="Range / %"
                            value={`${(totals.km / totals.pct).toFixed(2)}`}
                            unit={`${UNIT}/%`}
                            highlight
                            accentColor="#a5f3fc"
                        />
                        <StatTile
                            label="Range / kWh"
                            value={`${(totals.km / totals.kwh).toFixed(2)}`}
                            unit={`${UNIT}/kWh`}
                            accentColor="#cffafe"
                        />
                        <StatTile
                            label="Capacity"
                            value={`${(totals.kwh / totals.pct).toFixed(2)}`}
                            unit="kWh/%"
                            accentColor="#a5f3fc"
                        />
                    </div>

                    {/* Efficiency Chart */}
                    <div
                        className="glass-panel p-3"
                        style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(6, 182, 212, 0.2)' }}
                    >
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Real-World Efficiency ({UNIT}/kWh)
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#22d3ee', fontWeight: 600 }}>
                                Trend
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '140px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} ${UNIT}/kWh`, 'Efficiency']} />
                                        <Area type="monotone" dataKey="eff" stroke="#06b6d4" fill="rgba(6, 182, 212, 0.2)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '140px' }}>No range data yet 🌱</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* ── Top Header with Charge Sessions at Top Right ── */}
            <header className="flex justify-between items-center px-1">
                <div>
                    <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.85rem)', lineHeight: 1.15 }}>
                        {settings.carName || 'My EV'}
                    </h1>
                    <p className="text-xs" style={{ marginTop: '2px', opacity: 0.8 }}>
                        Dashboard & Insights
                    </p>
                </div>

                {/* Top Right Charge Sessions Count Badge */}
                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => navigate('/charging')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(16, 185, 129, 0.22))',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        boxShadow: '0 2px 12px -2px rgba(99, 102, 241, 0.25)',
                        cursor: 'pointer',
                    }}
                    title="View charge sessions"
                >
                    <Zap size={13} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    <span style={{
                        fontSize: 'clamp(0.72rem, 2.4vw, 0.82rem)',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        color: 'var(--text-primary)'
                    }}>
                        {charges.length} {charges.length === 1 ? 'Session' : 'Sessions'}
                    </span>
                </motion.button>
            </header>

            {/* ── First-time User Onboarding Nudge (if 0 sessions) ── */}
            {charges.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-3.5"
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

            {/* ── Expand/Collapse All Mini Control ── */}
            <div className="flex justify-between items-center px-1">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', opacity: 0.8 }}>
                    Primary Metrics
                </span>
                <button
                    onClick={toggleAllBars}
                    className="flex items-center gap-1 text-xs transition-opacity hover:opacity-100"
                    style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        opacity: 0.85,
                        padding: '2px 6px',
                    }}
                >
                    <Layers size={11} />
                    <span>{areAllExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
            </div>

            {/* ── 4 Stacked Horizontal Expandable Bars (No-Scroll in default collapsed state) ── */}
            <div className="flex flex-col gap-2.5">
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
                                borderWidth: '1px',
                                boxShadow: isExpanded ? bar.activeGlow : 'var(--shadow-soft)',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '16px',
                            }}
                        >
                            {/* ── Bar Header (Clickable to Toggle Accordion) ── */}
                            <div
                                onClick={() => toggleBar(bar.id)}
                                className="flex justify-between items-center cursor-pointer select-none"
                                style={{ minHeight: '44px' }}
                            >
                                {/* Left: Icon + Compact Intuitive Heading */}
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <div
                                        style={{
                                            padding: '7px',
                                            borderRadius: '10px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                            border: `1px solid ${bar.borderColor}`,
                                            color: bar.themeColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {bar.title}
                                        </span>
                                        <span style={{
                                            fontSize: '0.58rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            opacity: 0.65,
                                            lineHeight: 1.1,
                                        }}>
                                            {bar.subLabel}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Big Highlighted Number + Unit + Chevron Indicator */}
                                <div className="flex items-center gap-2 flex-shrink-0 text-right">
                                    <div className="flex items-baseline gap-1">
                                        <span style={{
                                            fontSize: 'clamp(1.15rem, 4.2vw, 1.55rem)',
                                            fontWeight: 800,
                                            letterSpacing: '-0.02em',
                                            color: 'var(--text-primary)',
                                            lineHeight: 1,
                                        }}>
                                            {bar.value}
                                        </span>
                                        {bar.unit && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'var(--text-secondary)',
                                                opacity: 0.8,
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
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.7,
                                        }}
                                    >
                                        <ChevronDown size={17} />
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
                                        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '0.5rem 0 0 0' }} />
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
