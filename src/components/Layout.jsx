import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Zap, Settings, Gauge, Wrench } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = () => {
    const location = useLocation();

    const navItems = [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/charging', icon: Zap, label: 'Charging' },
        { to: '/meter', icon: Gauge, label: 'Meter' },
        { to: '/expenses', icon: Wrench, label: 'Care' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen w-full relative flex flex-col overflow-hidden px-safe">

            {/* Main Content Area — padding-bottom accounts for navbar + safe area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pt-safe"
                style={{ height: '100vh' }}
            >
                <AnimatePresence mode="wait">
                    <motion.main
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 w-full max-w-5xl mx-auto pt-8"
                        style={{
                            paddingBottom: 'calc(var(--navbar-height) + var(--navbar-bottom-buffer) + 2rem)'
                        }}
                    >
                        <Outlet />
                    </motion.main>
                </AnimatePresence>
            </div>

            {/* Mobile Bottom Navigation — above system nav bar */}
            <div
                className="fixed bottom-0 left-0 right-0 z-[100] px-4 pointer-events-none"
                style={{
                    paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'
                }}
            >
                <nav
                    className="max-w-[480px] mx-auto glass-panel p-1 flex justify-between items-center shadow-2xl pointer-events-auto"
                    style={{
                        borderColor: 'var(--glass-border)',
                        minHeight: 'var(--navbar-height)',
                    }}
                >
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-200 ${isActive
                                    ? 'text-primary bg-white/10 scale-105 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`
                            }
                            style={{ minHeight: '48px' }}
                        >
                            <item.icon style={{ width: '20px', height: '20px' }} />
                            <span style={{
                                fontSize: 'clamp(8px, 2vw, 11px)',
                                marginTop: '2px',
                                fontWeight: 500,
                                textAlign: 'center',
                                lineHeight: 1.2,
                            }}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Layout;
