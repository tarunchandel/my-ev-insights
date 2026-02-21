import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [charges, setCharges] = useLocalStorage('ev_charges', []);
    const [bills, setBills] = useLocalStorage('ev_bills', []);
    const [settings, setSettings] = useLocalStorage('ev_settings', {
        currency: '₹',
        distanceUnit: 'km',
        batterySize: 40.5, // Nexon EV Max default example
        carName: 'My EV',
        homeRate: 8.0, // Default fallback
        theme: 'dark',
    });

    // Apply Theme
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(settings.theme);
        root.style.colorScheme = settings.theme;
    }, [settings.theme]);

    // --- Charges Logic ---
    const addCharge = (charge) => {
        const newCharge = { ...charge, id: Date.now().toString() };
        setCharges((prev) => [newCharge, ...prev]);
    };

    const deleteCharge = (id) => {
        setCharges((prev) => prev.filter(c => c.id !== id));
    };

    const updateCharge = (updatedCharge) => {
        setCharges((prev) => prev.map(c => c.id === updatedCharge.id ? updatedCharge : c));
    };

    // --- Bills Logic ---
    const addBill = (bill) => {
        const newBill = { ...bill, id: Date.now().toString() };
        setBills((prev) => [newBill, ...prev]);
    };

    const deleteBill = (id) => {
        setBills((prev) => prev.filter(b => b.id !== id));
    };

    const updateBill = (updatedBill) => {
        setBills((prev) => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    };

    // --- Expenses Logic ---
    const [expenses, setExpenses] = useLocalStorage('ev_expenses', []);

    const addExpense = (exp) => {
        const newExp = { ...exp, id: Date.now().toString() };
        setExpenses((prev) => [newExp, ...prev]);
    };

    const deleteExpense = (id) => {
        setExpenses((prev) => prev.filter(e => e.id !== id));
    };

    const updateExpense = (updatedExp) => {
        setExpenses((prev) => prev.map(e => e.id === updatedExp.id ? updatedExp : e));
    };

    const updateSettings = (newSettings) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const restoreData = (data) => {
        if (data.charges) setCharges(data.charges);
        if (data.bills) setBills(data.bills);
        if (data.settings) setSettings(data.settings);
        if (data.expenses) setExpenses(data.expenses);
    };

    // Derived Stats Helper
    const stats = useMemo(() => {
        const totalSpent = charges.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
        const totalUnits = charges.reduce((acc, c) => acc + (parseFloat(c.units) || 0), 0);

        // Total distance = latest odometer reading (sorted by timestamp descending)
        const sorted = [...charges].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const totalKms = sorted.length > 0 ? (parseFloat(sorted[0].odometer) || 0) : 0;

        return { totalSpent, totalKms, totalUnits };
    }, [charges]);

    return (
        <AppContext.Provider value={{
            charges, bills, settings, stats, expenses,
            addCharge, deleteCharge, updateCharge,
            addBill, deleteBill, updateBill,
            addExpense, deleteExpense, updateExpense,
            updateSettings, restoreData
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
