import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Calendar, Coins, Activity, Zap, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Meter = () => {
    const { addBill, updateBill, deleteBill, bills, settings } = useApp();
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        billDate: new Date().toISOString().split('T')[0],
        currentReading: '',
        lastReading: '',
        billAmount: '',
    };

    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (bill) => {
        setEditingId(bill.id);
        const dt = new Date(bill.billDate);
        setFormData({
            billDate: dt.toISOString().split('T')[0],
            currentReading: bill.currentReading || '',
            lastReading: bill.lastReading || '',
            billAmount: bill.billAmount || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this bill record?')) {
            deleteBill(id);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.currentReading || !formData.billAmount) return;

        const unitsConsumed = formData.lastReading
            ? Number(formData.currentReading) - Number(formData.lastReading)
            : 0;

        const rate = unitsConsumed > 0 ? (Number(formData.billAmount) / unitsConsumed) : 0;

        const payload = {
            ...formData,
            id: editingId || undefined,
            unitsConsumed,
            rate,
            timestamp: new Date(formData.billDate).getTime(),
        };

        if (editingId) {
            updateBill(payload);
            setEditingId(null);
            showToast(`Bill updated! Rate: ${settings.currency}${rate.toFixed(2)}/unit 💸`, 'success');
        } else {
            addBill(payload);
            showToast(`Bill saved! Rate: ${settings.currency}${rate.toFixed(2)}/unit ⚡`, 'success');
        }

        setFormData(prev => ({
            ...initialForm,
            // If adding new, maybe keep last reading as current, but reset everything else
            lastReading: editingId ? '' : prev.currentReading
        }));
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1>Home Juice Hookup 🏠⚡</h1>
                <p className="text-sm text-secondary">Track home electricity</p>
            </header>

            <form onSubmit={handleSubmit} className={`glass-panel p-6 flex flex-col gap-4 ${editingId ? 'border-primary/50' : ''}`}>
                <div className="flex justify-between items-center">
                    <h3 className="text-white text-sm font-normal">{editingId ? 'Tweak the Bill ✏️' : 'Log the Bill 💡'}</h3>
                    {editingId && <button type="button" onClick={cancelEdit}><X size={16} /></button>}
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-xs text-secondary flex items-center gap-1"><Calendar size={12} /> Bill Date</span>
                    <input type="date" name="billDate" value={formData.billDate} onChange={handleChange} required />
                </label>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Activity size={12} /> Last Reading</span>
                        <input type="number" name="lastReading" placeholder="e.g. 1000" value={formData.lastReading} onChange={handleChange} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-secondary flex items-center gap-1"><Activity size={12} /> Current Read</span>
                        <input type="number" name="currentReading" placeholder="e.g. 1250" value={formData.currentReading} onChange={handleChange} required />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-xs text-secondary flex items-center gap-1"><Coins size={12} /> Bill Amount ({settings.currency})</span>
                    <input type="number" name="billAmount" placeholder="e.g. 2450" value={formData.billAmount} onChange={handleChange} required />
                </label>

                <button type="submit" className="primary-btn mt-2 flex items-center justify-center gap-2">
                    {editingId ? <Edit2 size={18} /> : <Zap size={18} />}
                    {editingId ? 'Lock it in! 🔒' : 'Save the Power! ⚡'}
                </button>
            </form>

            <div className="flex flex-col gap-3">
                <div>
                    <h3>The Power Bills 📜</h3>
                    <p className="text-xs text-secondary">Bill history</p>
                </div>
                <AnimatePresence>
                    {bills.map((bill, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={bill.id}
                            className="glass-panel p-4 flex justify-between items-center"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-2">
                                    {new Date(bill.billDate).toLocaleDateString()}
                                    <div className="flex gap-1 ml-2 opacity-50">
                                        <button onClick={() => handleEdit(bill)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(bill.id)} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
                                    </div>
                                </span>
                                <span className="text-xs text-secondary">
                                    {bill.unitsConsumed > 0 ? `${bill.unitsConsumed} units` : 'Reading update'}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-primary font-bold">{settings.currency}{Number(bill.rate).toFixed(2)} <span className="text-[10px] font-normal text-secondary">/unit</span></div>
                                <div className="text-xs text-white">{settings.currency}{bill.billAmount}</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {bills.length === 0 && <p className="text-center text-sm text-secondary">No power bills yet – plug in and track! ⚡📊</p>}
            </div>
        </div>
    );
};

export default Meter;
