import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Activity, Coins, Battery } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { stats, charges, settings } = useApp();

    // Calculate global efficiency
    const efficiency = stats.totalKms > 0 ? (stats.totalSpent / stats.totalKms) : 0;

    const tiles = [
        {
            label: 'Total Spent',
            value: `${settings.currency}${stats.totalSpent.toLocaleString()}`,
            icon: Coins,
            style: {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))',
                borderColor: 'rgba(59, 130, 246, 0.3)',
            },
            iconStyle: { color: '#bfdbfe', backgroundColor: 'rgba(0,0,0,0.2)' } // blue-200
        },
        {
            label: 'Distanced Driven',
            value: `${stats.totalKms.toLocaleString()} ${settings.distanceUnit}`,
            icon: Activity,
            style: {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))',
                borderColor: 'rgba(16, 185, 129, 0.3)',
            },
            iconStyle: { color: '#a7f3d0', backgroundColor: 'rgba(0,0,0,0.2)' } // emerald-200
        },
        {
            label: 'Efficiency',
            value: `${efficiency.toFixed(2)} ${settings.currency}/${settings.distanceUnit}`,
            icon: Zap,
            style: {
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2))',
                borderColor: 'rgba(249, 115, 22, 0.3)',
            },
            iconStyle: { color: '#fed7aa', backgroundColor: 'rgba(0,0,0,0.2)' } // orange-200
        },
        {
            label: 'Total Energy',
            value: `${stats.totalUnits.toFixed(1)} kWh`,
            icon: Battery,
            style: {
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                borderColor: 'rgba(6, 182, 212, 0.3)',
            },
            iconStyle: { color: '#a5f3fc', backgroundColor: 'rgba(0,0,0,0.2)' } // cyan-200
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <h1>{settings.carName || 'My EV'}</h1>
            </header>

            {/* Pop-out Tiles Grid */}
            <div className="grid grid-cols-2 gap-3">
                {tiles.map((tile, i) => (
                    <motion.div
                        key={tile.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                        whileHover={{ scale: 1.05 }}
                        className="glass-panel p-4 flex flex-col justify-between aspect-square border-t-2"
                        style={tile.style}
                    >
                        <div>
                            <div className="p-2 w-fit rounded-lg mb-2" style={tile.iconStyle}>
                                <tile.icon size={20} />
                            </div>
                            <span className="text-secondary text-xs uppercase font-medium tracking-wide">{tile.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white break-words">
                            {tile.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <h3 className="text-white">Recent Activity</h3>
                <div className="flex flex-col gap-3">
                    {charges.slice(0, 3).map((charge, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            key={charge.id}
                            className="glass-panel p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${charge.type === 'Public' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="text-white font-medium">{charge.type} Charge</div>
                                    <div className="text-xs text-secondary">{new Date(charge.timestamp).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-white">+ {charge.units} kWh</div>
                                <div className="text-xs text-secondary">{settings.currency}{charge.cost}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                {charges.length === 0 && (
                    <div className="glass-panel p-8 text-center text-secondary">
                        <p>No charges logged yet.</p>
                        <p className="text-xs mt-2">Tap "Charge" to add your first session.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
