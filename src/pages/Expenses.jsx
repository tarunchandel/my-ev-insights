import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Coins, Activity, Wrench, FileText, Tag, Edit2, Trash2, X, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Expenses = () => {
    const { addExpense, updateExpense, deleteExpense, expenses, settings } = useApp();
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        category: 'Service',
        cost: '',
        odometer: '',
        note: '',
    };

    const [formData, setFormData] = useState(initialForm);

    const categories = ['Service', 'Insurance', 'Repairs', 'Accessories', 'Wash', 'Toll', 'Parking', 'Other'];
    const COLORS = ['#38bdf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#e879f9', '#22d3ee', '#94a3b8'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        const dt = new Date(item.timestamp);
        setFormData({
            date: dt.toISOString().split('T')[0],
            category: item.category,
            cost: item.cost,
            odometer: item.odometer || '',
            note: item.note || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this record?')) {
            deleteExpense(id);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.cost || !formData.category) return;

        const payload = {
            ...formData,
            id: editingId || undefined,
            timestamp: new Date(formData.date).getTime(),
        };

        if (editingId) {
            updateExpense(payload);
            setEditingId(null);
            alert('Record Updated!');
        } else {
            addExpense(payload);
            alert('Expense Saved!');
        }

        setFormData(initialForm);
    };

    // --- Analytics Logic ---
    const stats = useMemo(() => {
        const total = expenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

        // Category Breakdown
        const byCat = expenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + Number(curr.cost);
            return acc;
        }, {});

        const categoryData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

        // Sort for most expensive tile
        const sortedCats = [...categoryData].sort((a, b) => b.value - a.value);
        const topCat = sortedCats[0] || { name: '-', value: 0 };

        return { total, categoryData, topCat };
    }, [expenses]);

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>Service Logs</h1>
            </header>

            {/* Overview Tiles */}
            <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel p-4 flex flex-col justify-between aspect-[3/2] border-t-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                    <div className="p-2 bg-primary/20 text-primary w-fit rounded-lg">
                        <Coins size={20} />
                    </div>
                    <div>
                        <span className="text-secondary text-xs uppercase font-medium">Total Expenses</span>
                        <div className="text-2xl font-bold text-white">{settings.currency}{stats.total.toLocaleString()}</div>
                    </div>
                </div>

                <div className="glass-panel p-4 flex flex-col justify-between aspect-[3/2] border-t-2 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
                    <div className="p-2 bg-accent/20 text-accent w-fit rounded-lg">
                        <Tag size={20} />
                    </div>
                    <div>
                        <span className="text-secondary text-xs uppercase font-medium">Top Category</span>
                        <div className="text-lg font-bold text-white truncate">{stats.topCat.name}</div>
                        <div className="text-xs text-white/50">{settings.currency}{stats.topCat.value.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown Charts */}
            {stats.total > 0 && (
                <div className="flex flex-col gap-4">
                    {/* Category Tiles Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {stats.categoryData.map((cat) => (
                            <div key={cat.name} className="glass-panel p-3 flex justify-between items-center bg-white/5">
                                <span className="text-sm font-medium text-secondary">{cat.name}</span>
                                <span className="text-sm font-bold text-white">{settings.currency}{cat.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="glass-panel p-4 flex flex-col items-center">
                        <h3 className="text-xs uppercase text-secondary font-medium mb-2 w-full text-left">Spending Distribution</h3>
                        <div className="w-full h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={stats.categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {stats.categoryData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-[10px] text-secondary">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className={`glass-panel p-6 flex flex-col gap-4 ${editingId ? 'border-primary/50' : ''}`}>
                <div className="flex justify-between items-center">
                    <h3 className="text-white text-sm font-normal">{editingId ? 'Edit Record' : 'Add Expense'}</h3>
                    {editingId && <button type="button" onClick={cancelEdit}><X size={16} /></button>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Calendar size={12} /> Date</span>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Tag size={12} /> Category</span>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Coins size={12} /> Cost ({settings.currency})</span>
                        <input type="number" name="cost" placeholder="e.g. 5000" value={formData.cost} onChange={handleChange} required />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Activity size={12} /> Odometer ({settings.distanceUnit})</span>
                        <input type="number" name="odometer" placeholder="Optional" value={formData.odometer} onChange={handleChange} />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-xs text-secondary flex items-center gap-1"><FileText size={12} /> Note</span>
                    <input type="text" name="note" placeholder="e.g. 2nd Free Service" value={formData.note} onChange={handleChange} />
                </label>

                <button type="submit" className="primary-btn mt-2 flex items-center justify-center gap-2">
                    {editingId ? <Edit2 size={18} /> : <Wrench size={18} />}
                    {editingId ? 'Update Record' : 'Save Record'}
                </button>
            </form>

            <div className="flex flex-col gap-3">
                <h3>History</h3>
                <AnimatePresence>
                    {expenses.map((item, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={item.id}
                            className="glass-panel p-4 flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg text-secondary">
                                    <Wrench size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium flex items-center gap-2">
                                        {item.category}
                                        <div className="flex gap-1 ml-2 opacity-50">
                                            <button onClick={() => handleEdit(item)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
                                        </div>
                                    </span>
                                    <span className="text-xs text-secondary">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                        {item.note && ` • ${item.note}`}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-bold">{settings.currency}{item.cost}</div>
                                {item.odometer && <div className="text-[10px] text-secondary">{item.odometer} {settings.distanceUnit}</div>}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {expenses.length === 0 && <p className="text-center text-sm text-secondary">No records found.</p>}
            </div>
        </div>
    );
};

export default Expenses;
