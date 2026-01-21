import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Monitor, Car, CreditCard, Download, FileText, Globe, Coins, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const { settings, updateSettings, charges, bills, expenses, restoreData } = useApp();

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
            alert('No data to export.');
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
                alert('Data restored successfully!');
            } catch (err) {
                alert('Invalid backup file');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>Settings</h1>
            </header>

            {/* Appearance */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Monitor size={18} /> Appearance
                </h3>
                <div className="flex bg-black/10 dark:bg-black/40 p-1 rounded-xl">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => updateSettings({ theme: theme.id })}
                            className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${settings.theme === theme.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-secondary hover:text-primary'
                                }`}
                        >
                            <theme.icon size={16} />
                            {theme.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Localization */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Globe size={18} /> Localization
                </h3>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Coins size={12} /> Currency Symbol</span>
                        <input
                            type="text"
                            name="currency"
                            value={settings.currency}
                            onChange={handleChange}
                            placeholder="e.g. ₹, $, €"
                        />
                    </label>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Ruler size={12} /> Distance Unit</span>
                        <div className="flex bg-black/10 dark:bg-black/40 p-1 rounded-xl">
                            {['km', 'mi'].map((unit) => (
                                <button
                                    key={unit}
                                    onClick={() => updateSettings({ distanceUnit: unit })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium uppercase transition-all ${settings.distanceUnit === unit
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-secondary hover:text-white'
                                        }`}
                                >
                                    {unit === 'km' ? 'Kilometers' : 'Miles'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Profile */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Car size={18} /> Vehicle Profile
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
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary">Battery Size (kWh)</span>
                        <input
                            type="number"
                            name="batterySize"
                            value={settings.batterySize}
                            onChange={handleChange}
                            placeholder="e.g. 40.5"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary">Est. Home Rate ({settings.currency}/unit)</span>
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

            {/* Data Export */}
            <div className="glass-panel p-6">
                <h3 className="mb-4 flex items-center gap-2 text-primary">
                    <Download size={18} /> Data Management
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
                                <span className="text-sm font-medium text-white">Export Charging Logs</span>
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
                                <span className="text-sm font-medium text-white">Export Meter Logs</span>
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
                                <span className="text-sm font-medium text-white">Backup Data</span>
                                <span className="text-[10px] text-secondary">Save everything as JSON</span>
                            </div>
                        </div>
                    </button>

                    <label className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-pink-500/20 text-pink-400 p-2 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Restore Data</span>
                                <span className="text-[10px] text-secondary">Import JSON backup</span>
                            </div>
                        </div>
                        <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                    </label>
                </div>
            </div>

            <p className="text-center text-xs text-secondary mt-2">
                Version 1.0.2
            </p>
        </div>
    );
};

export default Settings;
