import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Gauge, Calendar, Coins, Zap, BarChart3, List, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const Meter = () => {
    const { addBill, updateBill, deleteBill, bills, settings } = useApp();
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('history');

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        startReading: '',
        endReading: '',
        amount: '',
        note: '',
    };

    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (bill) => {
        setEditingId(bill.id);

        // Handle both new schema and legacy schema (billAmount, currentReading, lastReading)
        setFormData({
            date: new Date(bill.timestamp || Date.now()).toISOString().split('T')[0],
            startReading: bill.startReading ?? bill.lastReading ?? '',
            endReading: bill.endReading ?? bill.currentReading ?? '',
            amount: bill.amount ?? bill.billAmount ?? '',
            note: bill.note ?? '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this bill?')) {
            deleteBill(id);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const units = (Number(formData.endReading) - Number(formData.startReading)) || 0;
        const payload = {
            ...formData,
            id: editingId || undefined,
            units: units > 0 ? units : 0,
            timestamp: new Date(formData.date).getTime(),
        };

        if (editingId) {
            updateBill(payload);
            showToast('Bill updated! ✅', 'success');
            setEditingId(null);
        } else {
            addBill(payload);
            showToast('Bill logged! 💡', 'success');
        }
        setFormData(initialForm);
    };

    const chartData = useMemo(() =>
        [...bills].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).map(b => ({
            date: new Date(b.timestamp || Date.now()).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
            amount: Number(b.amount ?? b.billAmount) || 0,
            units: Number(b.units ?? b.unitsConsumed) || 0,
        }))
        , [bills]);

    const totalSpent = bills.reduce((s, b) => s + Number(b.amount ?? b.billAmount ?? 0), 0);
    const totalUnits = bills.reduce((s, b) => s + Number(b.units ?? b.unitsConsumed ?? 0), 0);
    const avgRate = totalUnits > 0 ? (totalSpent / totalUnits) : 0;

    const tooltipStyle = {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '11px',
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>Meter Reading 🔌</h1>
                <p className="text-sm">Track electricity bills</p>
            </header>

            {/* ── Summary mini ── */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Total Paid', value: `${settings.currency}${totalSpent.toLocaleString()}`, unit: null, gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))' },
                    { label: 'Total kWh', value: `${totalUnits.toFixed(1)}`, unit: null, gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))' },
                    { label: 'Avg Rate', value: `${settings.currency}${avgRate.toFixed(2)}`, unit: '/kWh', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.15))' },
                ].map(t => (
                    <div key={t.label} className="glass-panel p-3 text-center" style={{ background: t.gradient }}>
                        <div style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)', fontWeight: 800, lineHeight: 1.1 }}>{t.value}</div>
                        {t.unit && (
                            <div style={{ fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.7, marginTop: '2px' }}>{t.unit}</div>
                        )}
                        <div style={{ fontSize: 'var(--font-size-tile-label)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '4px' }}>{t.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className={`glass-panel p-4 flex flex-col gap-3 ${editingId ? 'border-primary/50' : ''}`}>
                    {editingId && (
                        <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(167, 139, 250, 0.15)' }}>
                            <span className="text-sm text-primary font-medium">Editing bill... ✏️</span>
                            <button type="button" onClick={cancelEdit}><X size={16} /></button>
                        </div>
                    )}

                    <label className="flex flex-col gap-1">
                        <span className="form-label"><Calendar size={11} /> Bill Date</span>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Gauge size={11} /> Start Reading (kWh)</span>
                            <input type="number" step="0.1" name="startReading" placeholder="e.g. 450" value={formData.startReading} onChange={handleChange} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Gauge size={11} /> End Reading (kWh)</span>
                            <input type="number" step="0.1" name="endReading" placeholder="e.g. 520" value={formData.endReading} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Coins size={11} /> Bill Amount ({settings.currency})</span>
                            <input type="number" name="amount" placeholder="e.g. 1200" value={formData.amount} onChange={handleChange} required />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label">Note</span>
                            <input type="text" name="note" placeholder="e.g. Dec 2024" value={formData.note} onChange={handleChange} />
                        </label>
                    </div>

                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="primary-btn flex items-center justify-center gap-2">
                        {editingId ? <Edit2 size={16} /> : <Gauge size={16} />}
                        {editingId ? 'Update Bill' : 'Log Bill'}
                    </motion.button>
                </form>

                {/* ── Chart + History Toggle ── */}
                <div className="flex flex-col gap-4">
                    <div className="view-toggle">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`view-toggle-btn ${activeTab === 'history' ? 'active' : ''}`}
                        >
                            <List size={14} /> History
                        </button>
                        <button
                            onClick={() => setActiveTab('chart')}
                            className={`view-toggle-btn ${activeTab === 'chart' ? 'active' : ''}`}
                        >
                            <BarChart3 size={14} /> Chart
                        </button>
                    </div>

                    {activeTab === 'chart' ? (
                        <div className="glass-panel p-4">
                            <h3 className="section-heading">Electricity Costs ({settings.currency})</h3>
                            <div className="chart-container" style={{ height: '14rem' }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={45} />
                                            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                            <Bar dataKey="amount" fill="#818cf8" radius={[4, 4, 0, 0]} name={`Amount (${settings.currency})`} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="chart-empty">No bills logged yet 📊</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {bills.map((bill) => (
                                    <motion.div
                                        key={bill.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-panel p-3 log-card"
                                    >
                                        <div className="log-card-left">
                                            <div className="log-card-icon bg-violet-500/20 text-violet-400">
                                                <Gauge size={16} />
                                            </div>
                                            <div className="log-card-info">
                                                <span className="log-card-title">
                                                    {bill.note || 'Electricity Bill'}
                                                    <span className="log-card-actions">
                                                        <button onClick={() => handleEdit(bill)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDelete(bill.id)} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
                                                    </span>
                                                </span>
                                                <span className="log-card-subtitle">
                                                    {new Date(bill.timestamp || Date.now()).toLocaleDateString()} • {(bill.units ?? bill.unitsConsumed) ? `${(bill.units ?? bill.unitsConsumed)} kWh` : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="log-card-right">
                                            <div className="log-card-value text-violet-400">{settings.currency}{bill.amount ?? bill.billAmount}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {bills.length === 0 && <p className="empty-state">No bills yet — add your first! 💡</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Meter;
