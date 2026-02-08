import React from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Moon, Sun, Monitor, Car, CreditCard, Download, FileText, Globe, Coins, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const { settings, updateSettings, charges, bills, expenses, restoreData } = useApp();
    const { showToast } = useToast();

    const themes = [
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'light', label: 'Light', icon: Sun },
    ];

    const handleChange = (e) => {
        updateSettings({ [e.target.name]: e.target.value });
    };

    const downloadFile = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName =>
                JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)
            ).join(','))
        ].join('\n');
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    };

    const exportBackup = () => {
        const backupDate = new Date().toISOString().split('T')[0];
        const data = { settings, charges, bills, expenses };
        downloadFile(JSON.stringify(data, null, 2), `ev_tracker_backup_${backupDate}.json`, 'application/json');
    };

    const importBackup = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                restoreData(data);
                showToast('Data restored successfully! 🎉', 'success');
            } catch (err) {
                showToast('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>Setup Vibes ⚙️</h1>
                <p className="text-sm text-secondary">App preferences</p>
            </header>

            {/* Appearance */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Monitor size={18} /> Look & Feel 🎨
                </h3>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-secondary">Theme</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateSettings({ theme: 'dark' })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${settings.theme === 'dark'
                                ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                                : 'bg-transparent border-transparent text-secondary hover:border-white/20'
                                }`}
                        >
                            <Moon size={14} />
                            Dark
                        </button>
                        <button
                            onClick={() => updateSettings({ theme: 'light' })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${settings.theme === 'light'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                : 'bg-transparent border-transparent text-secondary hover:border-white/20'
                                }`}
                        >
                            <Sun size={14} />
                            Light
                        </button>
                    </div>
                </div>
            </div>

            {/* Localization */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Globe size={18} /> Local Vibes 🌍
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Coins size={12} /> Currency</span>
                        <input
                            type="text"
                            name="currency"
                            value={settings.currency}
                            onChange={handleChange}
                            placeholder="e.g. ₹, $"
                        />
                    </label>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Ruler size={12} /> Distance</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => updateSettings({ distanceUnit: 'km' })}
                                className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-2 ${settings.distanceUnit === 'km'
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                    : 'bg-transparent border-transparent text-secondary hover:border-white/20'
                                    }`}
                            >
                                km
                            </button>
                            <button
                                onClick={() => updateSettings({ distanceUnit: 'mi' })}
                                className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-2 ${settings.distanceUnit === 'mi'
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                    : 'bg-transparent border-transparent text-secondary hover:border-white/20'
                                    }`}
                            >
                                mi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Profile */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Car size={18} /> Car Identity 🚗
                </h3>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary">Car Name</span>
                        <input
                            type="text"
                            name="carName"
                            value={settings.carName}
                            onChange={handleChange}
                            placeholder="e.g. Nexon EV"
                        />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-secondary">Battery (kWh)</span>
                            <input
                                type="number"
                                name="batterySize"
                                value={settings.batterySize}
                                onChange={handleChange}
                                placeholder="e.g. 40.5"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-secondary">Home Rate ({settings.currency}/unit)</span>
                            <input
                                type="number"
                                name="homeRate"
                                value={settings.homeRate}
                                onChange={handleChange}
                                placeholder="e.g. 8.0"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Data Export */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Download size={18} /> Data Stash 📦
                </h3>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => exportToCSV(charges, 'ev_charging_logs.csv')}
                        className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Export Juice Logs ⚡</span>
                                <span className="text-[10px] text-secondary">Download as .csv</span>
                            </div>
                        </div>
                        <Download size={16} className="text-secondary" />
                    </button>

                    <button
                        onClick={() => exportToCSV(bills, 'ev_meter_logs.csv')}
                        className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500/20 text-orange-400 p-2 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Export Power Logs 💡</span>
                                <span className="text-[10px] text-secondary">Download as .csv</span>
                            </div>
                        </div>
                        <Download size={16} className="text-secondary" />
                    </button>

                    <div className="h-px bg-white/10 my-2" />

                    <button
                        onClick={exportBackup}
                        className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                                <Download size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Backup Everything 🛡️</span>
                                <span className="text-[10px] text-secondary">Keep your data safe!</span>
                            </div>
                        </div>
                    </button>

                    <label className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-pink-500/20 text-pink-400 p-2 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Bring it Back 🔄</span>
                                <span className="text-[10px] text-secondary">Restore from backup</span>
                            </div>
                        </div>
                        <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                    </label>
                </div>
            </div>

            <p className="text-center text-xs text-secondary mt-2">
                Version 1.0.2 – Made with ❤️
            </p>
        </div>
    );
};

export default Settings;
