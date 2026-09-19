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

// Sub-tile helper component — extracted outside Dashboard to prevent remounting on every render
const StatTile = ({ label, value, unit, highlight = false, accentColor = 'var(--color-primary)' }) => (
    <div
        className="flex flex-col justify-center items-center text-center transition-all"
        style={{
            background: 'var(--card-inner-bg)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: highlight ? accentColor : 'var(--card-inner-border)',
            borderWidth: '1px',
            borderStyle: 'solid',
            padding: '0.85rem 0.5rem',
            minHeight: '82px',
            borderRadius: '16px',
            boxShadow: highlight ? 'var(--card-inner-shadow-highlight)' : 'var(--card-inner-shadow)',
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
            color: 'var(--text-secondary)',
            marginTop: '5px',
            lineHeight: 1.2,
        }}>
            {label} {unit && <span style={{ opacity: 0.75 }}>({unit})</span>}
        </div>
    </div>
);

const Dashboard = () => {
    const { stats, charges, settings } = useApp();
    const [expandedBars, setExpandedBars] = useState({});
    const navigate = useNavigate();

    const CUR = settings.currency || '₹';
    const UNIT = (settings.distanceUnit || 'km').toUpperCase();

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
        // Distance travelled refers to the latest odometer reading
        const sorted = [...charges].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const latestWithOdo = sorted.find(c => c.odometer && parseFloat(c.odometer) > 0);
        const latestOdometer = latestWithOdo ? (parseFloat(latestWithOdo.odometer) || 0) : (stats.totalKms || 0);

        const acc = charges.reduce((sum, c) => ({
            pct: sum.pct + ((parseFloat(c.batteryPct) || 0) - (parseFloat(c.startPct) || 0)),
            kwh: sum.kwh + (parseFloat(c.units) || 0),
            cost: sum.cost + (parseFloat(c.cost) || 0),
        }), { pct: 0, kwh: 0, cost: 0 });

        return {
            km: latestOdometer,
            pct: acc.pct,
            kwh: acc.kwh,
            cost: acc.cost,
        };
    }, [charges, stats.totalKms]);

    const efficiency = totals.km > 0 ? (totals.cost / totals.km) : 0;

    // --- Avg Range for 100% charge ---
    const avgRange100 = useMemo(() => {
        return totals.pct > 0 ? ((totals.km / totals.pct) * 100) : 0;
    }, [totals]);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        const sorted = [...charges].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return sorted.map(c => {
            const drivenKm = parseFloat(c.drivenKm) || 0;
            const units = parseFloat(c.units) || 0;
            const cost = parseFloat(c.cost) || 0;
            const eff = drivenKm > 0 && units > 0 ? (drivenKm / units) : 0;
            const costEff = drivenKm > 0 && cost > 0 ? (cost / drivenKm) : 0;
            return {
                date: new Date(c.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                cost,
                km: drivenKm,
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

    // Definition of the 4 Stacked Horizontal Bars with vibrant, high-contrast themes
    const bars = [
        {
            id: 'spent',
            title: 'Money Spent',
            subLabel: 'Total Till Date',
            value: `${CUR}${totals.cost.toLocaleString()}`,
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
                            value={totals.km > 0 ? `${CUR}${(totals.cost / totals.km).toFixed(2)}` : '—'}
                            highlight
                            accentColor="#38bdf8"
                        />
                        <StatTile
                            label="Cost / %"
                            value={totals.pct > 0 ? `${CUR}${(totals.cost / totals.pct).toFixed(2)}` : '—'}
                            accentColor="#818cf8"
                        />
                        <StatTile
                            label="Unit Cost"
                            value={totals.kwh > 0 ? `${CUR}${(totals.cost / totals.kwh).toFixed(2)}` : '—'}
                            unit={`${CUR}/kWh`}
                            accentColor="#38bdf8"
                        />
                    </div>

                    {/* Cost Chart */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'var(--card-inner-bg)',
                            borderColor: 'rgba(56, 189, 248, 0.25)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Spending History ({CUR})
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800 }}>
                                {charges.length > 0 ? `Avg: ${CUR}${(totals.cost / charges.length).toFixed(0)}/session` : ''}
                            </span>
                        </div>
                        <div className="chart-container" style={{ height: '155px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--grid-stroke)" />
                                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${CUR}${v}`} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${CUR}${val}`, 'Cost']} />
                                        <Bar dataKey="cost" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '155px' }}>No spending data yet 📊</div>
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
            value: `${totals.km.toLocaleString()}`,
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
                            value={`${totals.kwh.toFixed(1)}`}
                            unit="kWh"
                            highlight
                            accentColor="#34d399"
                        />
                        <StatTile
                            label={`Energy / ${UNIT}`}
                            value={totals.km > 0 ? `${(totals.kwh / totals.km).toFixed(2)}` : '—'}
                            unit={`kWh/${UNIT}`}
                            accentColor="#6ee7b7"
                        />
                        <StatTile
                            label={`Drop / ${UNIT}`}
                            value={totals.km > 0 ? `${(totals.pct / totals.km).toFixed(2)}%` : '—'}
                            unit={`%/${UNIT}`}
                            accentColor="#34d399"
                        />
                    </div>

                    {/* Trip & Energy Summary Card */}
                    <div
                        className="p-4 rounded-2xl flex justify-between items-center"
                        style={{
                            background: 'var(--card-inner-bg)',
                            borderColor: 'rgba(16, 185, 129, 0.25)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex flex-col">
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                Avg Distance per Session
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
                                {charges.length > 0 ? (totals.km / charges.length).toFixed(1) : 0} {UNIT}
                            </span>
                        </div>
                        <div className="text-right flex flex-col">
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                Latest Odometer
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                                {totals.km.toLocaleString()} {UNIT}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'costPerKm',
            title: `Average ${CUR} / ${UNIT}`,
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
                            value={totals.cost > 0 ? `${(totals.km / totals.cost).toFixed(2)}` : '—'}
                            unit={`${UNIT}/${CUR}`}
                            highlight
                            accentColor="#fbbf24"
                        />
                        <StatTile
                            label={`kWh / ${CUR}`}
                            value={totals.cost > 0 ? `${(totals.kwh / totals.cost).toFixed(2)}` : '—'}
                            unit={`kWh/${CUR}`}
                            accentColor="#fde047"
                        />
                        <StatTile
                            label={`Drop / ${CUR}`}
                            value={totals.cost > 0 ? `${(totals.pct / totals.cost).toFixed(2)}%` : '—'}
                            unit={`%/${CUR}`}
                            accentColor="#fbbf24"
                        />
                    </div>

                    {/* Cost Efficiency Chart */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'var(--card-inner-bg)',
                            borderColor: 'rgba(245, 158, 11, 0.25)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
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
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--grid-stroke)" />
                                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${CUR}${val}/${UNIT}`, `Cost/${UNIT}`]} />
                                        <Area type="monotone" dataKey="costEff" stroke="#fbbf24" fill="rgba(245, 158, 11, 0.3)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '155px' }}>No cost data yet 🚗</div>
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
                            value={totals.pct > 0 ? `${(totals.km / totals.pct).toFixed(2)}` : '—'}
                            unit={`${UNIT}/%`}
                            highlight
                            accentColor="#22d3ee"
                        />
                        <StatTile
                            label="Range / kWh"
                            value={totals.kwh > 0 ? `${(totals.km / totals.kwh).toFixed(2)}` : '—'}
                            unit={`${UNIT}/kWh`}
                            accentColor="#67e8f9"
                        />
                        <StatTile
                            label="Capacity"
                            value={totals.pct > 0 ? `${(totals.kwh / totals.pct).toFixed(2)}` : '—'}
                            unit="kWh/%"
                            accentColor="#22d3ee"
                        />
                    </div>

                    {/* Efficiency Chart */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'var(--card-inner-bg)',
                            borderColor: 'rgba(6, 182, 212, 0.25)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
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
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--grid-stroke)" />
                                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} ${UNIT}/kWh`, 'Efficiency']} />
                                        <Area type="monotone" dataKey="eff" stroke="#06b6d4" fill="rgba(6, 182, 212, 0.3)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty" style={{ minHeight: '155px' }}>No range data yet 🌱</div>
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
                    <h1 style={{ fontSize: 'clamp(1.4rem, 4.6vw, 1.95rem)', fontWeight: 800, lineHeight: 1.15 }}>
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
                                boxShadow: isExpanded ? bar.activeGlow : 'var(--shadow-soft)',
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
                                            backgroundColor: 'var(--icon-container-bg)',
                                            border: `1px solid ${bar.borderColor}`,
                                            color: bar.themeColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
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
                                        <hr style={{ borderColor: 'var(--glass-border)', margin: '0.85rem 0 0 0' }} />
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
