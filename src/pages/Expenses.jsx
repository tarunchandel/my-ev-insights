import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Wrench, Calendar, Coins, List, BarChart3, Edit2, Trash2, X, Tag, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const CATEGORIES = ['Service', 'Tyres', 'Insurance', 'Body Work', 'Accessories', 'Other'];
const PIE_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#fb923c'];

const Expenses = () => {
    const { addExpense, updateExpense, deleteExpense, expenses, settings } = useApp();
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('log');

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        category: CATEGORIES[0],
        amount: '',
        description: '',
        note: '',
    };

    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (exp) => {
        setEditingId(exp.id);
        setFormData({
            date: new Date(exp.timestamp).toISOString().split('T')[0],
            category: exp.category,
            amount: exp.amount,
            description: exp.description || '',
            note: exp.note || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this expense?')) {
            deleteExpense(id);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            id: editingId || undefined,
            timestamp: new Date(formData.date).getTime(),
        };
        if (editingId) {
            updateExpense(payload);
            showToast('Expense updated! ✅', 'success');
            setEditingId(null);
        } else {
            addExpense(payload);
            showToast('Expense saved! 🔧', 'success');
        }
        setFormData(initialForm);
    };

    // Analytics
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const byCat = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
        return acc;
    }, {});
    const categoryData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

    const monthlyData = useMemo(() => {
        const grouped = {};
        expenses.forEach(e => {
            const key = new Date(e.timestamp).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
        });
        return Object.entries(grouped).map(([month, total]) => ({ month, total }));
    }, [expenses]);

    const tooltipStyle = {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '11px',
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>Car Care 🔧</h1>
                <p className="text-sm">Track maintenance & expenses</p>
            </header>

            {/* ── Summary ── */}
            <div className="grid grid-cols-2 gap-2">
                <div className="glass-panel p-3 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))' }}>
                    <div style={{ fontSize: 'var(--font-size-tile-number)', fontWeight: 800, lineHeight: 1.1 }}>
                        {settings.currency}{totalExpenses.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-tile-label)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '4px' }}>Total Spent</div>
                </div>
                <div className="glass-panel p-3 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.15))' }}>
                    <div style={{ fontSize: 'var(--font-size-tile-number)', fontWeight: 800, lineHeight: 1.1 }}>
                        {expenses.length}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-tile-label)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '4px' }}>Records</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className={`glass-panel p-4 flex flex-col gap-3 ${editingId ? 'border-primary/50' : ''}`}>
                    {editingId && (
                        <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(167, 139, 250, 0.15)' }}>
                            <span className="text-sm text-primary font-medium">Editing expense... ✏️</span>
                            <button type="button" onClick={cancelEdit}><X size={16} /></button>
                        </div>
                    )}

                    <label className="flex flex-col gap-1">
                        <span className="form-label"><Calendar size={11} /> Date</span>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="form-label"><Tag size={11} /> Category</span>
                        <select name="category" value={formData.category} onChange={handleChange}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Coins size={11} /> Amount ({settings.currency})</span>
                            <input type="number" name="amount" placeholder="e.g. 2500" value={formData.amount} onChange={handleChange} required />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><FileText size={11} /> Description</span>
                            <input type="text" name="description" placeholder="e.g. Tyre rotation" value={formData.description} onChange={handleChange} />
                        </label>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="form-label">Note</span>
                        <input type="text" name="note" placeholder="e.g. At service center" value={formData.note} onChange={handleChange} />
                    </label>

                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="primary-btn flex items-center justify-center gap-2">
                        {editingId ? <Edit2 size={16} /> : <Wrench size={16} />}
                        {editingId ? 'Update Expense' : 'Log Expense'}
                    </motion.button>
                </form>

                {/* ── Log + Charts Toggle ── */}
                <div className="flex flex-col gap-4">
                    <div className="view-toggle">
                        <button onClick={() => setActiveTab('log')} className={`view-toggle-btn ${activeTab === 'log' ? 'active' : ''}`}>
                            <List size={14} /> Log
                        </button>
                        <button onClick={() => setActiveTab('stats')} className={`view-toggle-btn ${activeTab === 'stats' ? 'active' : ''}`}>
                            <BarChart3 size={14} /> Stats
                        </button>
                    </div>

                    {activeTab === 'stats' ? (
                        <div className="flex flex-col gap-6">
                            {/* Pie */}
                            <div className="glass-panel p-4">
                                <h3 className="section-heading">By Category</h3>
                                <div className="chart-container" style={{ height: '14rem' }}>
                                    {categoryData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30} paddingAngle={4}>
                                                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="chart-empty">No data yet 📊</div>
                                    )}
                                </div>
                            </div>
                            {/* Monthly */}
                            <div className="glass-panel p-4">
                                <h3 className="section-heading">Monthly Spending</h3>
                                <div className="chart-container" style={{ height: '14rem' }}>
                                    {monthlyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyData}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={45} />
                                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                                <Bar dataKey="total" fill="#fbbf24" radius={[4, 4, 0, 0]} name={`Total (${settings.currency})`} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="chart-empty">No data yet 📊</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {expenses.map((exp, i) => (
                                    <motion.div
                                        key={exp.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-panel p-3 log-card"
                                    >
                                        <div className="log-card-left">
                                            <div className="log-card-icon bg-amber-500/20 text-amber-400">
                                                <Wrench size={16} />
                                            </div>
                                            <div className="log-card-info">
                                                <span className="log-card-title">
                                                    {exp.description || exp.category}
                                                    <span className="log-card-actions">
                                                        <button onClick={() => handleEdit(exp)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDelete(exp.id)} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
                                                    </span>
                                                </span>
                                                <span className="log-card-subtitle">
                                                    {new Date(exp.timestamp).toLocaleDateString()} • {exp.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="log-card-right">
                                            <div className="log-card-value text-amber-400">{settings.currency}{exp.amount}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {expenses.length === 0 && <p className="empty-state">No expenses yet — keep it rolling! 🚗</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;
