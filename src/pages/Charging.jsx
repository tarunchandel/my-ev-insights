import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Calendar, Coins, Activity, BatteryCharging, Edit2, Trash2, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Charging = () => {
    const { addCharge, updateCharge, deleteCharge, charges, settings } = useApp();
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        type: 'Public',
        odometer: '',
        startPct: '',
        batteryPct: '',
        units: '',
        cost: '',
    };

    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (charge) => {
        setEditingId(charge.id);
        const dt = new Date(charge.timestamp);
        setFormData({
            date: dt.toISOString().split('T')[0],
            time: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            type: charge.type,
            odometer: charge.odometer || '',
            startPct: charge.startPct || '',
            batteryPct: charge.batteryPct || '',
            units: charge.units,
            cost: charge.cost,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this session?')) {
            deleteCharge(id);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.odometer || !formData.cost || !formData.units) return;

        let drivenKm = 0;
        const lastCharge = charges[0];
        if (!editingId && lastCharge) {
            drivenKm = (Number(formData.odometer) - Number(lastCharge.odometer));
        } else if (editingId) {
            drivenKm = (Number(formData.odometer) - Number(lastCharge?.odometer || 0)); // Fallback
        }

        const payload = {
            ...formData,
            id: editingId || undefined,
            drivenKm: drivenKm > 0 ? drivenKm : 0,
            timestamp: new Date(`${formData.date}T${formData.time}`).getTime(),
        };

        if (editingId) {
            updateCharge(payload);
            setEditingId(null);
            alert('Session Updated!');
        } else {
            addCharge(payload);
            alert('Session Saved!');
        }

        setFormData(initialForm);
    };

    const fillHeight = formData.batteryPct ? `${Math.min(formData.batteryPct, 100)}%` : '0%';
    const startHeight = formData.startPct ? `${Math.min(formData.startPct, 100)}%` : '0%';

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <h1>{editingId ? 'Edit Charge' : 'Add Charge'}</h1>
                <div className="relative w-8 h-12 border-2 border-white/30 rounded-md p-0.5">
                    <div className="w-4 h-1 bg-white/30 absolute -top-2 left-1.5 rounded-t-sm"></div>
                    <motion.div
                        className="w-full bg-primary rounded-sm absolute bottom-0.5 left-0.5 right-0.5"
                        initial={{ height: startHeight }}
                        animate={{ height: fillHeight }}
                        transition={{ type: "spring", stiffness: 100 }}
                        style={{ maxHeight: 'calc(100% - 4px)' }}
                    />
                </div>
            </header>

            <form onSubmit={handleSubmit} className={`glass-panel p-6 flex flex-col gap-4 ${editingId ? 'border-primary/50' : ''}`}>
                {editingId && (
                    <div className="flex justify-between items-center bg-primary/20 p-2 rounded-lg mb-2">
                        <span className="text-sm text-primary font-medium">Editing session...</span>
                        <button type="button" onClick={cancelEdit}><X size={16} /></button>
                    </div>
                )}

                <div className="flex bg-black/20 dark:bg-black/40 p-1 rounded-xl">
                    {['Home', 'Public'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === type ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Calendar size={12} /> Date</span>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary">Time</span>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} required />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Activity size={12} /> Odometer ({settings.distanceUnit})</span>
                        <input type="number" name="odometer" placeholder="e.g. 3450" value={formData.odometer} onChange={handleChange} required />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><BatteryCharging size={12} /> Start %</span>
                        <input type="number" name="startPct" placeholder="e.g. 20" value={formData.startPct} onChange={handleChange} />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><BatteryCharging size={12} /> End %</span>
                        <input type="number" name="batteryPct" placeholder="e.g. 80" value={formData.batteryPct} onChange={handleChange} />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Zap size={12} /> Units (kWh)</span>
                        <input type="number" step="0.1" name="units" placeholder="e.g. 20.5" value={formData.units} onChange={handleChange} required />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-xs text-secondary flex items-center gap-1"><Coins size={12} /> Cost ({settings.currency})</span>
                    <input type="number" name="cost" placeholder="e.g. 400" value={formData.cost} onChange={handleChange} required />
                </label>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="primary-btn mt-2 flex items-center justify-center gap-2"
                >
                    {editingId ? <Edit2 size={18} /> : <Zap size={18} />}
                    {editingId ? 'Update Session' : 'Save Session'}
                </motion.button>
            </form>

            <div className="flex flex-col gap-3">
                <h3>History</h3>
                <AnimatePresence>
                    {charges.map((charge) => (
                        <motion.div
                            key={charge.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-panel p-4 flex justify-between items-center"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-2">
                                    <div className={`p-1.5 rounded-full ${charge.type === 'Home' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {charge.type === 'Home' ? <Home size={14} /> : <Zap size={14} />}
                                    </div>
                                    <span className={charge.type === 'Home' ? 'text-emerald-100' : 'text-blue-100'}>
                                        {charge.type} Charge
                                    </span>
                                    {/* Edit Controls */}
                                    <div className="flex gap-1 ml-2 opacity-50">
                                        <button onClick={() => handleEdit(charge)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(charge.id)} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
                                    </div>
                                </span>
                                <span className="text-xs text-secondary">{new Date(charge.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${charge.type === 'Home' ? 'text-emerald-400' : 'text-blue-400'}`}>+ {charge.units} kWh</div>
                                <div className="text-xs text-white">{settings.currency}{charge.cost}</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {charges.length === 0 && <p className="text-center text-sm text-secondary">No history yet.</p>}
            </div>
        </div>
    );
};

export default Charging;
