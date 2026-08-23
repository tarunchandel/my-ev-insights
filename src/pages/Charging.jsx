import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Zap, Calendar, Coins, Activity, BatteryCharging, Edit2, Trash2, X, Home, MapPin, FileText, BarChart3, List, Clock, Gauge, Receipt, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import html2pdf from 'html2pdf.js';

const Charging = () => {
    const { addCharge, updateCharge, deleteCharge, charges, settings } = useApp();
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('history');
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [selectedForExport, setSelectedForExport] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const printRef = useRef(null);

    // Generate a unique receipt ID from charge data
    const generateReceiptId = useCallback((charge) => {
        const date = new Date(charge.timestamp);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const shortId = String(charge.id).slice(-4).toUpperCase().padStart(4, '0');
        return `RCP-${dateStr}-${shortId}`;
    }, []);

    // Display name mapping: 'Home' type → 'Mahavitran' on receipts
    const getDisplayCompany = useCallback((charge) => {
        if (charge.type === 'Home') {
            return charge.company === 'Home' ? 'Mahavitran' : charge.company;
        }
        return charge.company || charge.type;
    }, []);

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

    // --- Chart Data: kWh by date, split by Home/Public ---
    const chartData = useMemo(() => {
        const sorted = [...charges].sort((a, b) => a.timestamp - b.timestamp);
        return sorted.map(c => ({
            date: new Date(c.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            homeKwh: c.type === 'Home' ? Number(c.units || 0) : 0,
            publicKwh: c.type !== 'Home' ? Number(c.units || 0) : 0,
        }));
    }, [charges]);

    const tooltipStyle = {
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '11px',
    };

    // --- Selection Handlers ---
    const toggleSelectForExport = useCallback((chargeId, e) => {
        e.stopPropagation();
        setSelectedForExport(prev =>
            prev.includes(chargeId)
                ? prev.filter(id => id !== chargeId)
                : [...prev, chargeId]
        );
    }, []);

    const selectAllForExport = useCallback(() => {
        setSelectedForExport(charges.map(c => c.id));
    }, [charges]);

    const clearSelection = useCallback(() => {
        setSelectedForExport([]);
    }, []);

    // --- PDF Export ---
    // --- PDF Export ---
    const exportToPDF = useCallback(async () => {
        const selected = charges.filter(c => selectedForExport.includes(c.id));
        if (selected.length === 0) return;
        setIsExporting(true);

        // Build receipt HTML
        const receiptHtmls = selected.map(charge => {
            const receiptId = generateReceiptId(charge);
            const displayCompany = getDisplayCompany(charge);
            const dateStr = new Date(charge.timestamp).toLocaleDateString('en-GB', {
                weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
            });
            const timeStr = new Date(charge.timestamp).toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit'
            });
            const isHome = charge.type === 'Home';
            const accentColor = isHome ? '#10b981' : '#3b82f6';
            const accentBg = isHome
                ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.12))'
                : 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(96,165,250,0.12))';
            const accentBorder = isHome ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)';
            const emoji = isHome ? '🏠' : '⚡';
            const locationLabel = isHome ? 'Mahavitran' : (charge.type || 'Public');

            const rows = [
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">📅 Date</span><span style="font-weight:600;color:#1a1a2e;">${dateStr}</span></div>`,
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">🕐 Start Time</span><span style="font-weight:600;color:#1a1a2e;">${timeStr}</span></div>`,
            ];

            if (charge.endTime) {
                rows.push(`<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">🕐 End Time</span><span style="font-weight:600;color:#1a1a2e;">${charge.endTime}</span></div>`);
            }

            rows.push(`<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">📍 Location</span><span style="font-weight:600;color:#1a1a2e;">${locationLabel}</span></div>`);
            rows.push(`<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">⚡ Current Type</span><span style="font-weight:600;color:#1a1a2e;">${charge.acDc || 'AC'}</span></div>`);

            if (charge.power) {
                rows.push(`<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">⚡ Power</span><span style="font-weight:600;color:#1a1a2e;">${charge.power} kW</span></div>`);
            }

            let batterySection = '';
            if (charge.startPct || charge.batteryPct) {
                batterySection = `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">🔋 Battery</span><span style="font-weight:600;color:#1a1a2e;">${charge.startPct || '0'}% → ${charge.batteryPct || '—'}%</span></div>
                    <div style="height:8px;border-radius:4px;background:rgba(0,0,0,0.06);position:relative;overflow:hidden;margin:0.5rem 0;">
                        <div style="height:100%;border-radius:4px;position:absolute;left:0;top:0;width:${Math.min(charge.batteryPct || 0, 100)}%;background:linear-gradient(90deg,#34d399,#10b981);"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#9ca3af;margin-top:0.25rem;"><span>${charge.startPct || 0}%</span><span>${charge.batteryPct || 0}%</span></div>
                `;
            }

            const energyRow = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">⚡ Energy Consumed</span><span style="font-weight:600;color:#1a1a2e;">${charge.units || 0} kWh</span></div>`;

            let meterRow = '';
            if (charge.startUnits || charge.endUnits) {
                meterRow = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">📊 Meter Reading</span><span style="font-weight:600;color:#1a1a2e;">${charge.startUnits || '—'} → ${charge.endUnits || '—'} kWh</span></div>`;
            }

            let odometerRow = '';
            if (charge.odometer) {
                odometerRow = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">📊 Odometer</span><span style="font-weight:600;color:#1a1a2e;">${charge.odometer} ${settings.distanceUnit}</span></div>`;
            }

            let drivenRow = '';
            if (charge.drivenKm > 0) {
                drivenRow = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;font-size:0.8rem;"><span style="color:#6b7280;font-weight:500;">📍 Distance Driven</span><span style="font-weight:600;color:#1a1a2e;">${charge.drivenKm} ${settings.distanceUnit}</span></div>`;
            }

            const costPerKwh = (charge.units > 0 && charge.cost > 0)
                ? `<div style="font-size:0.7rem;color:#9ca3af;margin-top:0.35rem;">${settings.currency}${(Number(charge.cost) / Number(charge.units)).toFixed(2)} / kWh</div>`
                : '';

            let noteSection = '';
            if (charge.note) {
                noteSection = `
                    <hr style="border:none;border-top:2px dashed rgba(0,0,0,0.1);margin:1rem 0;" />
                    <div style="font-size:0.75rem;color:#6b7280;text-align:center;font-style:italic;padding:0.5rem 0;">📄 ${charge.note}</div>
                `;
            }

            return `
                <div style="background:#fefefe;color:#1a1a2e;padding:1.75rem 1.5rem 1.5rem;border:2px solid rgba(0,0,0,0.12);border-radius:4px;font-family:'Outfit',system-ui,sans-serif;max-width:380px;margin:0 auto;page-break-inside:avoid;break-inside:avoid;">
                    <!-- Header -->
                    <div style="text-align:center;margin-bottom:1.25rem;">
                        <div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 0.75rem;font-size:1.5rem;background:${isHome ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)'};border:2px solid ${isHome ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}">${emoji}</div>
                        <h3 style="font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;margin:0;color:#1a1a2e;">${displayCompany} Charging</h3>
                        <p style="font-size:0.7rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-top:0.25rem;">Charging Session Receipt</p>
                        <div style="font-size:0.65rem;color:#9ca3af;font-family:monospace;text-align:center;letter-spacing:0.08em;margin-top:0.25rem;background:rgba(0,0,0,0.03);padding:0.25rem 0.5rem;border-radius:4px;display:inline-block;">${receiptId}</div>
                    </div>

                    <hr style="border:none;border-top:2px dashed rgba(0,0,0,0.1);margin:1rem 0;" />

                    ${rows.join('')}

                    <hr style="border:none;border-top:2px dashed rgba(0,0,0,0.1);margin:1rem 0;" />

                    ${batterySection}
                    ${energyRow}
                    ${meterRow}
                    ${odometerRow}
                    ${drivenRow}

                    <hr style="border:none;border-top:2px dashed rgba(0,0,0,0.1);margin:1rem 0;" />

                    <!-- Total -->
                    <div style="margin:1rem 0 0.5rem;padding:1rem;border-radius:12px;text-align:center;background:${accentBg};border:1px solid ${accentBorder};">
                        <div style="font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;margin-bottom:0.35rem;">Amount Paid</div>
                        <div style="font-size:2rem;font-weight:800;letter-spacing:-0.03em;line-height:1;color:${accentColor};">${settings.currency}${charge.cost || '0'}</div>
                        ${costPerKwh}
                    </div>

                    ${noteSection}

                    <hr style="border:none;border-top:2px dashed rgba(0,0,0,0.1);margin:1rem 0;" />

                    <!-- Footer -->
                    <div style="text-align:center;margin-top:0.75rem;">
                        <div style="font-size:0.6rem;color:#d1d5db;text-transform:uppercase;letter-spacing:0.15em;">Thank you for charging green! 🌱</div>
                        <div style="font-size:0.55rem;color:#d1d5db;font-family:monospace;margin-top:0.25rem;letter-spacing:0.05em;">Session ID: #${charge.id}</div>
                    </div>

                    <!-- Footnotes -->
                    <div style="margin-top:0.75rem;padding-top:0.5rem;display:flex;flex-direction:column;gap:0.25rem;">
                        <div style="font-size:0.55rem;color:#9ca3af;text-align:center;letter-spacing:0.02em;line-height:1.4;"><sup style="font-size:0.45rem;font-weight:700;color:#a78bfa;margin-right:0.15rem;">1</sup> Paid directly to the charging company</div>
                        <div style="font-size:0.55rem;color:#9ca3af;text-align:center;letter-spacing:0.02em;line-height:1.4;"><sup style="font-size:0.45rem;font-weight:700;color:#a78bfa;margin-right:0.15rem;">2</sup> Billing info service managed by My EV Insights</div>
                    </div>
                </div>
            `;
        });

        // Build complete print document
        const printDoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>EV Charging Receipts</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>
                    body {
                        font-family: 'Outfit', system-ui, sans-serif;
                        background: #fff;
                        margin: 0;
                        padding: 20px;
                    }
                    .receipt-page {
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        padding: 20px 0;
                        page-break-after: always;
                    }
                    .receipt-page:last-child {
                        page-break-after: auto;
                    }
                </style>
            </head>
            <body>
                ${receiptHtmls.map(h => `<div class="receipt-page">${h}</div>`).join('')}
            </body>
            </html>
        `;

        try {
            const element = document.createElement('div');
            element.innerHTML = printDoc;

            const opt = {
                margin: 0,
                filename: `EV_Receipts_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            if (Capacitor.isNativePlatform()) {
                const pdfBase64 = await html2pdf().from(element).set(opt).output('datauristring');
                const base64Data = pdfBase64.split(',')[1];
                const fileName = `EV_Receipts_${Date.now()}.pdf`;
                
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Documents
                });
                
                await Share.share({
                    title: 'EV Charging Receipts',
                    url: savedFile.uri
                });
                
                setIsExporting(false);
                showToast(`${selected.length} receipt${selected.length > 1 ? 's' : ''} exported! 📄`, 'success');
            } else {
                await html2pdf().from(element).set(opt).save();
                setIsExporting(false);
                showToast(`${selected.length} receipt${selected.length > 1 ? 's' : ''} exported! 📄`, 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            setIsExporting(false);
            showToast('Failed to export PDF', 'error');
        }
    }, [charges, selectedForExport, settings, generateReceiptId, getDisplayCompany, showToast]);

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

                {/* ── Charging Log + Chart Toggle ── */}
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
                            <h3 className="section-heading"><Zap size={16} /> Charging (kWh) by Date</h3>
                            <div className="chart-container" style={{ height: '14rem' }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={40} />
                                            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="homeKwh" stackId="kwh" fill="#34d399" radius={[0, 0, 0, 0]} name="Mahavitran" />
                                            <Bar dataKey="publicKwh" stackId="kwh" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Public" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="chart-empty">No charging data yet 📊</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <h3 className="section-heading"><Zap size={16} /> Charging History</h3>

                            {/* Export bar */}
                            {charges.length > 0 && (
                                <div className="export-bar">
                                    <div className="export-bar-info">
                                        <Receipt size={14} />
                                        {selectedForExport.length > 0
                                            ? `${selectedForExport.length} selected`
                                            : 'Select sessions to export'}
                                    </div>
                                    <div className="export-bar-actions">
                                        {selectedForExport.length < charges.length ? (
                                            <button className="export-select-all-btn" onClick={selectAllForExport}>Select All</button>
                                        ) : (
                                            <button className="export-clear-btn" onClick={clearSelection}>Clear</button>
                                        )}
                                        <button
                                            className="export-btn"
                                            onClick={exportToPDF}
                                            disabled={selectedForExport.length === 0 || isExporting}
                                        >
                                            <Download size={13} />
                                            {isExporting ? 'Exporting...' : 'PDF'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <AnimatePresence>
                                {charges.map((charge) => (
                                    <motion.div
                                        key={charge.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`glass-panel p-3 log-card clickable ${selectedForExport.includes(charge.id) ? 'border-primary/50' : ''}`}
                                        onClick={() => setSelectedCharge(charge)}
                                    >
                                        <div className="log-card-left">
                                            <button
                                                className={`charge-select-checkbox ${selectedForExport.includes(charge.id) ? 'selected' : ''}`}
                                                onClick={(e) => toggleSelectForExport(charge.id, e)}
                                                aria-label={`Select ${charge.type} charge for export`}
                                            >
                                                {selectedForExport.includes(charge.id) && <Check size={12} />}
                                            </button>
                                            <div className={`log-card-icon ${charge.type === 'Home' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {charge.type === 'Home' ? <Home size={16} /> : <Zap size={16} />}
                                            </div>
                                            <div className="log-card-info">
                                                <span className="log-card-title">
                                                    {charge.type === 'Home' ? 'Mahavitran' : charge.type} Charge
                                                    <span className="log-card-actions">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(charge); }} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(charge.id); }} className="p-1 hover:text-danger"><Trash2 size={12} /></button>
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
                    )}
                </div>
            </div>

            {/* ── Receipt Modal ── */}
            <AnimatePresence>
                {selectedCharge && (
                    <motion.div
                        className="receipt-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedCharge(null)}
                    >
                        <motion.div
                            className="receipt-card"
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="receipt-paper">
                                <button className="receipt-close" onClick={() => setSelectedCharge(null)}>
                                    <X size={14} />
                                </button>

                                {/* Header */}
                                <div className="receipt-header">
                                    <div className={`receipt-logo ${selectedCharge.type === 'Home' ? 'home' : 'public'}`}>
                                        {selectedCharge.type === 'Home' ? '🏠' : '⚡'}
                                    </div>
                                    <h3 className="receipt-title">
                                        {getDisplayCompany(selectedCharge)} Charging
                                    </h3>
                                    <p className="receipt-subtitle">Charging Session Receipt</p>
                                    <div className="receipt-id">{generateReceiptId(selectedCharge)}</div>
                                </div>

                                <hr className="receipt-divider" />

                                {/* Session Details */}
                                <div className="receipt-row">
                                    <span className="receipt-row-label"><Calendar size={12} /> Date</span>
                                    <span className="receipt-row-value">
                                        {new Date(selectedCharge.timestamp).toLocaleDateString('en-GB', {
                                            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="receipt-row">
                                    <span className="receipt-row-label"><Clock size={12} /> Start Time</span>
                                    <span className="receipt-row-value">
                                        {new Date(selectedCharge.timestamp).toLocaleTimeString('en-GB', {
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {selectedCharge.endTime && (
                                    <div className="receipt-row">
                                        <span className="receipt-row-label"><Clock size={12} /> End Time</span>
                                        <span className="receipt-row-value">{selectedCharge.endTime}</span>
                                    </div>
                                )}

                                <div className="receipt-row">
                                    <span className="receipt-row-label"><MapPin size={12} /> Location</span>
                                    <span className="receipt-row-value">{selectedCharge.type === 'Home' ? 'Mahavitran' : selectedCharge.type}</span>
                                </div>

                                <div className="receipt-row">
                                    <span className="receipt-row-label"><Zap size={12} /> Current Type</span>
                                    <span className="receipt-row-value">{selectedCharge.acDc || 'AC'}</span>
                                </div>

                                {selectedCharge.power && (
                                    <div className="receipt-row">
                                        <span className="receipt-row-label"><Gauge size={12} /> Power</span>
                                        <span className="receipt-row-value">{selectedCharge.power} kW</span>
                                    </div>
                                )}

                                <hr className="receipt-divider" />

                                {/* Battery Section */}
                                {(selectedCharge.startPct || selectedCharge.batteryPct) && (
                                    <>
                                        <div className="receipt-row">
                                            <span className="receipt-row-label"><BatteryCharging size={12} /> Battery</span>
                                            <span className="receipt-row-value">
                                                {selectedCharge.startPct || '0'}% → {selectedCharge.batteryPct || '—'}%
                                            </span>
                                        </div>
                                        <div className="receipt-battery-bar">
                                            <div
                                                className="receipt-battery-fill start"
                                                style={{ width: `${Math.min(selectedCharge.batteryPct || 0, 100)}%` }}
                                            />
                                            <motion.div
                                                className="receipt-battery-fill end"
                                                initial={{ width: `${Math.min(selectedCharge.startPct || 0, 100)}%` }}
                                                animate={{ width: `${Math.min(selectedCharge.batteryPct || 0, 100)}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <div className="receipt-battery-labels">
                                            <span>{selectedCharge.startPct || 0}%</span>
                                            <span>{selectedCharge.batteryPct || 0}%</span>
                                        </div>
                                    </>
                                )}

                                {/* Energy */}
                                <div className="receipt-row">
                                    <span className="receipt-row-label"><Zap size={12} /> Energy Consumed</span>
                                    <span className="receipt-row-value">{selectedCharge.units || 0} kWh</span>
                                </div>

                                {(selectedCharge.startUnits || selectedCharge.endUnits) && (
                                    <div className="receipt-row">
                                        <span className="receipt-row-label"><Activity size={12} /> Meter Reading</span>
                                        <span className="receipt-row-value">
                                            {selectedCharge.startUnits || '—'} → {selectedCharge.endUnits || '—'} kWh
                                        </span>
                                    </div>
                                )}

                                {selectedCharge.odometer && (
                                    <div className="receipt-row">
                                        <span className="receipt-row-label"><Activity size={12} /> Odometer</span>
                                        <span className="receipt-row-value">{selectedCharge.odometer} {settings.distanceUnit}</span>
                                    </div>
                                )}

                                {selectedCharge.drivenKm > 0 && (
                                    <div className="receipt-row">
                                        <span className="receipt-row-label"><MapPin size={12} /> Distance Driven</span>
                                        <span className="receipt-row-value">{selectedCharge.drivenKm} {settings.distanceUnit}</span>
                                    </div>
                                )}

                                <hr className="receipt-divider" />

                                {/* Total Amount */}
                                <div className={`receipt-total-section ${selectedCharge.type === 'Home' ? 'home' : 'public'}`}>
                                    <div className="receipt-total-label">Amount Paid</div>
                                    <div className={`receipt-total-amount ${selectedCharge.type === 'Home' ? 'home' : 'public'}`}>
                                        {settings.currency}{selectedCharge.cost || '0'}
                                    </div>
                                    {selectedCharge.units > 0 && selectedCharge.cost > 0 && (
                                        <div className="receipt-total-sub">
                                            {settings.currency}{(Number(selectedCharge.cost) / Number(selectedCharge.units)).toFixed(2)} / kWh
                                        </div>
                                    )}
                                </div>

                                {/* Note */}
                                {selectedCharge.note && (
                                    <>
                                        <hr className="receipt-divider" />
                                        <div className="receipt-note">
                                            <FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                            {selectedCharge.note}
                                        </div>
                                    </>
                                )}

                                {/* Footer */}
                                <hr className="receipt-divider" />
                                <div className="receipt-footer">
                                    <div className="receipt-footer-text">Thank you for charging green! 🌱</div>
                                    <div className="receipt-session-id">Session ID: #{selectedCharge.id}</div>
                                </div>

                                {/* Footnotes */}
                                <div className="receipt-footnotes">
                                    <div className="receipt-footnote">
                                        <sup>1</sup> Paid directly to the charging company
                                    </div>
                                    <div className="receipt-footnote">
                                        <sup>2</sup> Billing info service managed by My EV Insights
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Charging;
