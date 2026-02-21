import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Settings as SettingsIcon, Download, Upload, Moon, Sun, Car, FileText, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const Settings = () => {
    const { settings, updateSettings, charges, bills, expenses, restoreData } = useApp();
    const { showToast } = useToast();
    const [theme, setTheme] = useState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const fileInput = useRef(null);

    const isNative = Capacitor.isNativePlatform();

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        updateSettings({ ...settings, theme: next });
    };

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        updateSettings({ ...settings, [e.target.name]: value });
    };

    // ── Saving/Sharing Logic ──
    const saveOrShareFile = async (content, filename, mimeType) => {
        try {
            if (isNative) {
                // For native: Save to temp directory and Share
                const { uri } = await Filesystem.writeFile({
                    path: filename,
                    data: content,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                });

                await Share.share({
                    title: filename,
                    text: `Exported ${filename}`,
                    url: uri,
                    dialogTitle: `Save ${filename}`,
                });
                showToast(`Exported ${filename} 📤`, 'success');
            } else {
                // For web: Standard download link
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
                showToast(`Exported ${filename} 💾`, 'success');
            }
        } catch (err) {
            console.error('Save failed:', err);
            showToast('Failed to save file', 'error');
        }
    };

    // ── Export CSV ──
    const exportToCSV = (data, filename) => {
        if (!data || !data.length) { showToast('No data to export', 'warning'); return; }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName =>
                JSON.stringify(row[fieldName], (_, value) => value === null ? '' : value)
            ).join(','))
        ].join('\n');

        saveOrShareFile(csvContent, filename, 'text/csv');
    };

    // ── Export full JSON backup ──
    const exportBackup = () => {
        const payload = { charges, bills, expenses, settings, exportedAt: new Date().toISOString() };
        const content = JSON.stringify(payload, null, 2);
        saveOrShareFile(content, `ev-insights-backup-${Date.now()}.json`, 'application/json');
    };

    // ── Import JSON backup ──
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.charges && !data.bills && !data.expenses) {
                    showToast('Invalid backup file', 'error');
                    return;
                }
                restoreData(data);
                showToast('Data restored! 🎉', 'success');
            } catch (err) {
                console.error('Import failed:', err);
                showToast('Failed to read file', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const sectionStyle = {
        fontSize: 'var(--font-size-form-heading)',
        fontWeight: 600,
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem',
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <header>
                <h1>Settings ⚙️</h1>
                <p className="text-sm">Customize your experience</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Appearance ── */}
                <div className="glass-panel p-4 flex flex-col gap-4">
                    <div style={sectionStyle}><SettingsIcon size={14} /> Appearance</div>

                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-medium" style={{ fontSize: '0.875rem' }}>Theme</span>
                            <p className="text-xs" style={{ margin: 0 }}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{
                                background: theme === 'dark' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid var(--glass-border)',
                                minHeight: '40px',
                            }}
                        >
                            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                        </motion.button>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="form-label">Currency Symbol</span>
                        <select name="currency" value={settings.currency} onChange={handleChange}>
                            <option value="₹">₹ INR</option>
                            <option value="$">$ USD</option>
                            <option value="€">€ EUR</option>
                            <option value="£">£ GBP</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="form-label">Distance Unit</span>
                        <select name="distanceUnit" value={settings.distanceUnit} onChange={handleChange}>
                            <option value="km">Kilometers (km)</option>
                            <option value="mi">Miles (mi)</option>
                        </select>
                    </label>
                </div>

                {/* ── Vehicle ── */}
                <div className="glass-panel p-4 flex flex-col gap-4">
                    <div style={sectionStyle}><Car size={14} /> Vehicle Details</div>

                    <label className="flex flex-col gap-1">
                        <span className="form-label">Car Name</span>
                        <input type="text" name="carName" placeholder="e.g. My Nexon EV" value={settings.carName || ''} onChange={handleChange} />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="form-label">Battery Capacity (kWh)</span>
                        <input type="number" name="batteryCapacity" placeholder="e.g. 30.2" value={settings.batteryCapacity || ''} onChange={handleChange} />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="form-label">Purchase Date</span>
                        <input type="date" name="purchaseDate" value={settings.purchaseDate || ''} onChange={handleChange} />
                    </label>
                </div>

                {/* ── Data Export ── */}
                <div className="glass-panel p-4 flex flex-col gap-4">
                    <div style={sectionStyle}><FileText size={14} /> Data Export</div>

                    <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => exportToCSV(charges, 'charging-sessions.csv')}
                            className="flex items-center gap-2 p-3 rounded-xl transition-all"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', minHeight: '48px' }}>
                            <Download size={14} className="text-emerald-400" />
                            <span className="text-sm font-medium">Export Charging (CSV)</span>
                        </button>

                        <button onClick={() => exportToCSV(bills, 'meter-bills.csv')}
                            className="flex items-center gap-2 p-3 rounded-xl transition-all"
                            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', minHeight: '48px' }}>
                            <Download size={14} className="text-violet-400" />
                            <span className="text-sm font-medium">Export Bills (CSV)</span>
                        </button>

                        <button onClick={() => exportToCSV(expenses, 'expenses.csv')}
                            className="flex items-center gap-2 p-3 rounded-xl transition-all"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', minHeight: '48px' }}>
                            <Download size={14} className="text-amber-400" />
                            <span className="text-sm font-medium">Export Expenses (CSV)</span>
                        </button>
                    </div>
                </div>

                {/* ── Backup & Restore ── */}
                <div className="glass-panel p-4 flex flex-col gap-4">
                    <div style={sectionStyle}><Database size={14} /> Backup & Restore</div>

                    <button onClick={exportBackup}
                        className="flex items-center gap-2 p-3 rounded-xl transition-all"
                        style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', minHeight: '48px' }}>
                        <Download size={14} className="text-primary" />
                        <span className="text-sm font-medium">Full Backup (JSON)</span>
                    </button>

                    <input ref={fileInput} type="file" accept=".json" className="hidden" onChange={handleImport} />
                    <button onClick={() => fileInput.current?.click()}
                        className="flex items-center gap-2 p-3 rounded-xl transition-all"
                        style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', minHeight: '48px' }}>
                        <Upload size={14} className="text-cyan-400" />
                        <span className="text-sm font-medium">Restore from Backup</span>
                    </button>

                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.5, textAlign: 'center' }}>
                        ⚠️ Restoring will replace all current data
                    </p>
                </div>
            </div>

            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.4, textAlign: 'center', paddingBottom: '1rem' }}>
                My EV Insights • Built with 💚
            </p>
        </div>
    );
};

export default Settings;
