import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Zap, Activity, Battery, Percent, BarChart3, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';

const Stats = () => {
    const { charges, settings } = useApp();
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'charts'

    const CUR = settings.currency;
    const UNIT = settings.distanceUnit.toUpperCase(); // KM or MI

    // --- Grid Data Logic ---
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

        const createTile = (val, unit, label, highlight = false) => ({
            value: val.toFixed(2),
            unit,
            label,
            highlight
        });

        return [
            {
                title: 'Cost Analysis',
                icon: Coins,
                color: 'text-blue-200',
                gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))',
                border: 'rgba(59, 130, 246, 0.3)',
                tiles: [
                    createTile(t.cost / t.km, `${CUR} / ${UNIT}`, `Cost per ${UNIT}`, true),
                    createTile(t.cost / t.pct, `${CUR} / %`, 'Cost per %'),
                    createTile(t.cost / t.kwh, `${CUR} / KWh`, 'Avg Unit Cost'),
                ]
            },
            {
                title: 'Range Efficiency',
                icon: Activity,
                color: 'text-emerald-200',
                gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(20, 184, 166, 0.15))',
                border: 'rgba(16, 185, 129, 0.3)',
                tiles: [
                    createTile(t.km / t.pct, `${UNIT} / %`, 'Range per %', true),
                    createTile(t.km / t.kwh, `${UNIT} / KWh`, 'Range per Unit'),
                    createTile(t.km / t.cost, `${UNIT} / ${CUR}`, `${UNIT} per ${CUR}`),
                ]
            },
            {
                title: 'Energy Spec',
                icon: Zap,
                color: 'text-orange-200',
                gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.15))',
                border: 'rgba(249, 115, 22, 0.3)',
                tiles: [
                    createTile(t.kwh / t.km, `KWh / ${UNIT}`, `Energy per ${UNIT}`),
                    createTile(t.kwh / t.pct, 'KWh / %', 'Bat. Capacity Est'),
                    createTile(t.kwh / t.cost, `KWh / ${CUR}`, `Units per ${CUR}`),
                ]
            },
            {
                title: 'Battery Usage',
                icon: Battery,
                color: 'text-cyan-200',
                gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))',
                border: 'rgba(6, 182, 212, 0.3)',
                tiles: [
                    createTile(t.pct / t.km, `% / ${UNIT}`, `Drop per ${UNIT}`),
                    createTile(t.pct / t.kwh, '% / KWh', '% Drop per Unit'),
                    createTile(t.pct / t.cost, `% / ${CUR}`, `% Drop per ${CUR}`),
                ]
            }
        ];
    }, [charges, settings]);

    // --- Chart Data Logic ---
    const chartData = useMemo(() => {
        // Sort charges by date
        const sorted = [...charges].sort((a, b) => a.timestamp - b.timestamp);

        return sorted.map(c => {
            const efficiency = c.drivenKm > 0 && c.units > 0 ? (c.drivenKm / c.units) : 0;
            const kostEfficiency = c.drivenKm > 0 ? (c.cost / c.drivenKm) : 0;
            return {
                date: new Date(c.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                cost: Number(c.cost),
                km: Number(c.drivenKm),
                eff: efficiency.toFixed(1), // UNIT/kWh
                costEff: kostEfficiency.toFixed(1), // Cur/UNIT
            };
        });
    }, [charges]);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <h1>Stats</h1>
                {/* View Switcher */}
                <div className="flex bg-black/20 dark:bg-black/40 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-secondary'}`}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('charts')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'charts' ? 'bg-white/10 text-white' : 'text-secondary'}`}
                    >
                        <BarChart3 size={18} />
                    </button>
                </div>
            </header>

            {viewMode === 'grid' ? (
                <div className="flex flex-col gap-6">
                    {sections.map((section, secIdx) => (
                        <div key={section.title} className="flex flex-col gap-3">
                            <div className={`flex items-center gap-2 ${section.color} px-1`}>
                                <section.icon size={18} />
                                <h3 className="text-sm font-medium uppercase tracking-wider opacity-80">{section.title}</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {section.tiles.map((tile, i) => (
                                    <motion.div
                                        key={tile.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (secIdx * 0.1) + (i * 0.05) }}
                                        className="glass-panel p-2 flex flex-col justify-center items-center text-center aspect-[4/3]"
                                        style={{
                                            background: section.gradient,
                                            borderColor: tile.highlight ? section.border : 'rgba(255,255,255,0.1)',
                                            borderWidth: tile.highlight ? '1px' : '1px'
                                        }}
                                    >
                                        <div className={`font-bold ${tile.highlight ? 'text-white text-lg' : 'text-white/90 text-base'}`}>
                                            {tile.value}
                                        </div>
                                        <div className="text-[9px] text-white/60 font-medium uppercase mt-1">
                                            {tile.unit}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6 pb-4">
                    {/* Cost Chart */}
                    <div className="glass-panel p-4">
                        <h3 className="text-sm text-secondary mb-4 uppercase tracking-wide">Spending Trend ({CUR})</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${CUR}${val}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="cost" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Efficiency Chart */}
                    <div className="glass-panel p-4">
                        <h3 className="text-sm text-secondary mb-4 uppercase tracking-wide">Efficiency ({UNIT} / kWh)</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="eff" stroke="#2dd4bf" fill="rgba(45, 212, 191, 0.2)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cost Efficiency Chart */}
                    <div className="glass-panel p-4">
                        <h3 className="text-sm text-secondary mb-4 uppercase tracking-wide">Running Cost ({CUR} / {UNIT})</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="costEff" stroke="#f87171" fill="rgba(248, 113, 113, 0.2)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-center text-xs text-secondary mt-0 mb-4">
                * Charts based on individual session logs
            </p>
        </div>
    );
};

export default Stats;
