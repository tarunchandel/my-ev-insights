import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Zap, Calendar, Coins, Activity, BatteryCharging, Edit2, Trash2, X, Home, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Charging = () => {
    const { addCharge, updateCharge, deleteCharge, charges, settings } = useApp();
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        endTime: '',
        type: 'Public',
        acDc: 'AC',
        company: 'Home',
        power: '',
        odometer: '',
        startPct: '',
        batteryPct: '',
        startUnits: '',
        endUnits: '',
        cost: '',
        note: '',
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
            endTime: charge.endTime || '',
            type: charge.type,
            acDc: charge.acDc || 'AC',
            company: charge.company || 'Home',
            power: charge.power || '',
            odometer: charge.odometer || '',
            startPct: charge.startPct || '',
            batteryPct: charge.batteryPct || '',
            startUnits: charge.startUnits || '',
            endUnits: charge.endUnits || charge.units || '',
            cost: charge.cost || '',
            note: charge.note || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this charging session?')) {
            deleteCharge(id);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const startU = Number(formData.startUnits) || 0;
        const endU = Number(formData.endUnits) || 0;
        const units = endU > startU ? (endU - startU) : (endU || 0);

        let drivenKm = 0;
        const lastCharge = charges[0];
        if (!editingId && lastCharge) {
            drivenKm = (Number(formData.odometer) - Number(lastCharge.odometer));
        } else if (editingId) {
            drivenKm = (Number(formData.odometer) - Number(lastCharge?.odometer || 0));
        }

        const payload = {
            ...formData,
            id: editingId || undefined,
            units,
            startUnits: formData.startUnits,
            endUnits: formData.endUnits,
            drivenKm: drivenKm > 0 ? drivenKm : 0,
            timestamp: new Date(`${formData.date}T${formData.time}`).getTime(),
        };

        if (editingId) {
            updateCharge(payload);
            setEditingId(null);
            showToast('Session updated! ✨', 'success');
        } else {
            addCharge(payload);
            showToast('Session saved! ⚡', 'success');
        }

        setFormData(initialForm);
    };

    const fillHeight = formData.batteryPct ? `${Math.min(formData.batteryPct, 100)}%` : '0%';
    const startHeight = formData.startPct ? `${Math.min(formData.startPct, 100)}%` : '0%';

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1>{editingId ? 'Edit Session ⚡' : 'Charging Log 🔋'}</h1>
                    <p className="text-sm">{editingId ? 'Edit charging session' : 'Log a charging session'}</p>
                </div>
                <div className="relative w-8 h-12" style={{ border: '2px solid var(--glass-shine)', borderRadius: '6px', padding: '2px' }}>
                    <div className="w-4 h-1 absolute -top-2 left-1.5 rounded-t-sm" style={{ background: 'var(--glass-shine)' }} />
                    <motion.div
                        className="w-full absolute bottom-0.5 left-0.5 right-0.5 rounded-sm"
                        style={{ background: 'var(--color-primary)', maxHeight: 'calc(100% - 4px)' }}
                        initial={{ height: startHeight }}
                        animate={{ height: fillHeight }}
                        transition={{ type: "spring", stiffness: 100 }}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <form onSubmit={handleSubmit} className={`glass-panel p-4 flex flex-col gap-3 ${editingId ? 'border-primary/50' : ''}`}>
                    {editingId && (
                        <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(167, 139, 250, 0.15)' }}>
                            <span className="text-sm text-primary font-medium">Editing session... ✏️</span>
                            <button type="button" onClick={cancelEdit}><X size={16} /></button>
                        </div>
                    )}

                    {/* Location & Current Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="form-label">Location</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'Home' })}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${formData.type === 'Home' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-secondary hover:bg-white/10'}`}
                                    style={{ minHeight: '40px' }}>
                                    <Home size={13} /> Home
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'Public' })}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${formData.type === 'Public' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-transparent text-secondary hover:bg-white/10'}`}
                                    style={{ minHeight: '40px' }}>
                                    <MapPin size={13} /> Public
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="form-label">Current Type</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setFormData({ ...formData, acDc: 'AC' })}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-all border ${formData.acDc === 'AC' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm' : 'bg-white/5 border-transparent text-secondary hover:bg-white/10'}`}
                                    style={{ minHeight: '40px' }}>
                                    AC ⚡
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, acDc: 'DC' })}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-all border ${formData.acDc === 'DC' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-sm' : 'bg-white/5 border-transparent text-secondary hover:bg-white/10'}`}
                                    style={{ minHeight: '40px' }}>
                                    DC 🚀
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Charger Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label">Charger / Company</span>
                            <input type="text" name="company" placeholder="e.g. Shell Recharge" value={formData.company} onChange={handleChange} />
                        </label>
                        <div className="flex flex-col gap-1">
                            <span className="form-label">Power (kW)</span>
                            <input type="number" step="0.1" name="power" placeholder="e.g. 7.2" value={formData.power} onChange={handleChange} />
                            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                {['3.3', '7.2', '11', '22', '50'].map(p => (
                                    <button key={p} type="button" onClick={() => setFormData({ ...formData, power: p })}
                                        style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Calendar size={11} /> Date</span>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label">Start Time</span>
                            <input type="time" name="time" value={formData.time} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label">End Time</span>
                            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Activity size={11} /> Odometer ({settings.distanceUnit})</span>
                            <input type="number" name="odometer" placeholder="e.g. 3450" value={formData.odometer} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><BatteryCharging size={11} /> Start %</span>
                            <input type="number" name="startPct" placeholder="e.g. 20" value={formData.startPct} onChange={handleChange} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><BatteryCharging size={11} /> End %</span>
                            <input type="number" name="batteryPct" placeholder="e.g. 80" value={formData.batteryPct} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Zap size={11} /> Start kWh</span>
                            <input type="number" step="0.1" name="startUnits" placeholder="e.g. 100.5" value={formData.startUnits} onChange={handleChange} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Zap size={11} /> End kWh</span>
                            <input type="number" step="0.1" name="endUnits" placeholder="e.g. 120.5" value={formData.endUnits} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><Coins size={11} /> Cost ({settings.currency})</span>
                            <input type="number" name="cost" placeholder="e.g. 400" value={formData.cost} onChange={handleChange} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="form-label"><FileText size={11} /> Note</span>
                            <input type="text" name="note" placeholder="e.g. Mall" value={formData.note} onChange={handleChange} />
                        </label>
                    </div>

                    <p style={{ fontSize: '0.7rem', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.6, padding: '0.25rem 0' }}>
                        💡 All fields are optional — you can edit later!
                    </p>

                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="primary-btn flex items-center justify-center gap-2">
                        {editingId ? <Edit2 size={16} /> : <Zap size={16} />}
                        {editingId ? 'Update Session' : 'Save Session'}
                    </motion.button>
                </form>

                {/* ── Charging Log ── */}
                <div className="flex flex-col gap-3">
                    <h3 className="section-heading"><Zap size={16} /> Charging History</h3>
                    <AnimatePresence>
                        {charges.map((charge) => (
                            <motion.div
                                key={charge.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel p-3 log-card"
                            >
                                <div className="log-card-left">
                                    <div className={`log-card-icon ${charge.type === 'Home' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {charge.type === 'Home' ? <Home size={16} /> : <Zap size={16} />}
                                    </div>
                                    <div className="log-card-info">
                                        <span className="log-card-title">
                                            {charge.type} Charge
                                            <span className="log-card-actions">
                                                <button onClick={() => handleEdit(charge)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                                <button onClick={() => handleDelete(charge.id)} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
                                            </span>
                                        </span>
                                        <span className="log-card-subtitle">{new Date(charge.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="log-card-right">
                                    <div className={`log-card-value ${charge.type === 'Home' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                        + {charge.units} kWh
                                    </div>
                                    <div className="log-card-meta">{settings.currency}{charge.cost}</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {charges.length === 0 && <p className="empty-state">No charging sessions yet — plug in! 🔌</p>}
                </div>
            </div>
        </div>
    );
};

export default Charging;
