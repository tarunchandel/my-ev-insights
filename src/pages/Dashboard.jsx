import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Activity, Coins, Battery, BarChart3, Grid, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';

const Dashboard = () => {
    const { stats, charges, settings } = useApp();
    const [viewMode, setViewMode] = useState('grid');

    const CUR = settings.currency;
    const UNIT = settings.distanceUnit.toUpperCase();
    const efficiency = stats.totalKms > 0 ? (stats.totalSpent / stats.totalKms) : 0;

    // --- Stats Sections ---
    const sections = useMemo(() => {
        const totals = charges.reduce((acc, c) => ({
            km: acc.km + (parseFloat(c.drivenKm) || 0),
            pct: acc.pct + ((parseFloat(c.batteryPct) || 0) - (parseFloat(c.startPct) || 0)),
            kwh: acc.kwh + (parseFloat(c.units) || 0),
            cost: acc.cost + (parseFloat(c.cost) || 0),
        }), { km: 0, pct: 0, kwh: 0, cost: 0 });

        const t = {
            km: totals.km || 1,
            pct: totals.pct || 1,
            kwh: totals.kwh || 1,
            cost: totals.cost || 1,
        };

        const tile = (val, unit, label, highlight = false) => ({
            value: val.toFixed(2), unit, label, highlight
        });

        return [
            {
                title: 'Money Talks 💰', icon: Coins, color: 'text-blue-200',
                gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))',
                border: 'rgba(59, 130, 246, 0.3)',
                tiles: [
                    tile(t.cost / t.km, `${CUR}/${UNIT}`, `Cost/${UNIT}`, true),
                    tile(t.cost / t.pct, `${CUR}/%`, 'Cost/%'),
                    tile(t.cost / t.kwh, `${CUR}/kWh`, 'Unit Cost'),
                ]
            },
            {
                title: 'Road Mastery 🛣️', icon: Activity, color: 'text-emerald-200',
                gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(20, 184, 166, 0.15))',
                border: 'rgba(16, 185, 129, 0.3)',
                tiles: [
                    tile(t.km / t.pct, `${UNIT}/%`, 'Range/%', true),
                    tile(t.km / t.kwh, `${UNIT}/kWh`, 'Range/kWh'),
                    tile(t.km / t.cost, `${UNIT}/${CUR}`, `${UNIT}/${CUR}`),
                ]
            },
            {
                title: 'Power Profile ⚡', icon: Zap, color: 'text-orange-200',
                gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.15))',
                border: 'rgba(249, 115, 22, 0.3)',
                tiles: [
                    tile(t.kwh / t.km, `kWh/${UNIT}`, `Energy/${UNIT}`),
                    tile(t.kwh / t.pct, 'kWh/%', 'Capacity'),
                    tile(t.kwh / t.cost, `kWh/${CUR}`, `Units/${CUR}`),
                ]
            },
            {
                title: 'Battery Meter 🔋', icon: Battery, color: 'text-cyan-200',
                gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))',
                border: 'rgba(6, 182, 212, 0.3)',
                tiles: [
                    tile(t.pct / t.km, `%/${UNIT}`, `Drop/${UNIT}`),
                    tile(t.pct / t.kwh, '%/kWh', 'Drop/kWh'),
                    tile(t.pct / t.cost, `%/${CUR}`, `Drop/${CUR}`),
                ]
            }
        ];
    }, [charges, settings]);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        const sorted = [...charges].sort((a, b) => a.timestamp - b.timestamp);
        return sorted.map(c => {
            const eff = c.drivenKm > 0 && c.units > 0 ? (c.drivenKm / c.units) : 0;
            const costEff = c.drivenKm > 0 ? (c.cost / c.drivenKm) : 0;
            return {
                date: new Date(c.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                cost: Number(c.cost),
                km: Number(c.drivenKm),
                eff: Number(eff.toFixed(1)),
                costEff: Number(costEff.toFixed(1)),
            };
        });
    }, [charges]);

    // --- Summary tiles data ---
    const summaryTiles = [
        {
            label: 'Total Spent', value: `${CUR}${stats.totalSpent.toLocaleString()}`, icon: Coins,
            bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))',
            border: 'rgba(59, 130, 246, 0.3)', iconColor: '#bfdbfe'
        },
        {
            label: 'Distance', value: `${stats.totalKms.toLocaleString()}`, unit: UNIT, icon: Activity,
            bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))',
            border: 'rgba(16, 185, 129, 0.3)', iconColor: '#a7f3d0'
        },
        {
            label: 'Efficiency', value: efficiency.toFixed(2), unit: `${CUR}/${UNIT}`, icon: Zap,
            bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2))',
            border: 'rgba(249, 115, 22, 0.3)', iconColor: '#fed7aa'
        },
        {
            label: 'Energy', value: `${stats.totalUnits.toFixed(1)}`, unit: 'kWh', icon: Battery,
            bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
            border: 'rgba(6, 182, 212, 0.3)', iconColor: '#a5f3fc'
        },
        {
            label: 'Sessions', value: `${charges.length}`, icon: Hash,
            bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.2))',
            border: 'rgba(236, 72, 153, 0.3)', iconColor: '#fbcfe8'
        },
    ];

    const tooltipStyle = {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '11px',
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>{settings.carName || 'My EV'}</h1>
                <p className="text-sm">Dashboard & Analytics</p>
            </header>

            {/* ── Summary Tiles — Compact Horizontal Layout ── */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 min-w-[320px]">
                    {summaryTiles.map((tile, i) => (
                        <motion.div
                            key={tile.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                            className="glass-panel border-t-2"
                            style={{
                                background: tile.bg,
                                borderColor: tile.border,
                                padding: '0.5rem 0.625rem',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Row: Icon + Number side-by-side */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <div style={{
                                    padding: '4px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(0,0,0,0.15)',
                                    flexShrink: 0,
                                    lineHeight: 0,
                                }}>
                                    <tile.icon style={{ width: '14px', height: '14px', color: tile.iconColor }} />
                                </div>
                                <div style={{
                                    fontSize: 'clamp(1rem, 3.5vw, 1.5rem)',
                                    fontWeight: 800,
                                    lineHeight: 1.1,
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                }}>
                                    {tile.value}
                                </div>
                            </div>

                            {/* Unit + Label below */}
                            <div style={{ marginTop: '0.25rem' }}>
                                {tile.unit && (
                                    <div style={{
                                        fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        opacity: 0.7,
                                    }}>
                                        {tile.unit}
                                    </div>
                                )}
                                <div style={{
                                    fontSize: 'clamp(0.5rem, 1.6vw, 0.65rem)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: 'var(--text-secondary)',
                                    opacity: 0.6,
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {tile.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── View Switcher ── */}
            <div className="flex justify-end items-center px-1">
                <div className="view-toggle" style={{ width: 'fit-content' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        style={{ padding: '0.5rem' }}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('charts')}
                        className={`view-toggle-btn ${viewMode === 'charts' ? 'active' : ''}`}
                        style={{ padding: '0.5rem' }}
                    >
                        <BarChart3 size={18} />
                    </button>
                </div>
            </div>

            <hr style={{ borderColor: 'var(--glass-border)', margin: '0' }} />

            {/* ── Stats Grid or Charts ── */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section, secIdx) => (
                        <div key={section.title} className="flex flex-col gap-3">
                            <div className={`flex items-center gap-2 ${section.color} px-1`}>
                                <section.icon size={16} />
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 }}>
                                    {section.title}
                                </h3>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {section.tiles.map((tile, i) => (
                                    <motion.div
                                        key={tile.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (secIdx * 0.08) + (i * 0.04) }}
                                        className="glass-panel flex flex-col justify-center items-center text-center"
                                        style={{
                                            background: section.gradient,
                                            borderColor: tile.highlight ? section.border : 'rgba(255,255,255,0.1)',
                                            borderWidth: '1px',
                                            padding: '0.5rem 0.25rem',
                                            aspectRatio: '4 / 3',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* Number — largest */}
                                        <div style={{
                                            fontSize: tile.highlight ? 'var(--font-size-tile-number)' : 'clamp(0.9rem, 3.5vw, 1.3rem)',
                                            fontWeight: 800,
                                            color: tile.highlight ? 'var(--text-primary)' : 'var(--text-primary)',
                                            opacity: tile.highlight ? 1 : 0.9,
                                            lineHeight: 1.1,
                                        }}>
                                            {tile.value}
                                        </div>
                                        {/* Unit */}
                                        <div style={{
                                            fontSize: 'var(--font-size-tile-unit)',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            marginTop: '2px',
                                            opacity: 0.6,
                                        }}>
                                            {tile.unit}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                    {/* Cost Chart */}
                    <div className="glass-panel p-4">
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Spending ({CUR})
                        </h3>
                        <div className="chart-container" style={{ height: '12rem' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={40} tickFormatter={(val) => `${CUR}${val}`} />
                                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                        <Bar dataKey="cost" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">No data yet 📊</div>
                            )}
                        </div>
                    </div>

                    {/* Efficiency Chart */}
                    <div className="glass-panel p-4">
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Efficiency ({UNIT}/kWh)
                        </h3>
                        <div className="chart-container" style={{ height: '12rem' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={40} domain={[0, 'auto']} />
                                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                        <Area type="monotone" dataKey="eff" stroke="#2dd4bf" fill="rgba(45, 212, 191, 0.2)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">No data yet 🌱</div>
                            )}
                        </div>
                    </div>

                    {/* Cost per KM Chart */}
                    <div className="glass-panel p-4">
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Cost per {UNIT} ({CUR}/{UNIT})
                        </h3>
                        <div className="chart-container" style={{ height: '12rem' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={40} />
                                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                        <Area type="monotone" dataKey="costEff" stroke="#f87171" fill="rgba(248, 113, 113, 0.2)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">No data yet 🚗</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
