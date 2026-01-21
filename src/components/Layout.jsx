import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Zap, BarChart2, Settings, Gauge, Wrench } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = () => {
    const location = useLocation();

    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/charging', icon: Zap, label: 'Charge' },
        { to: '/stats', icon: BarChart2, label: 'Stats' },
        { to: '/meter', icon: Gauge, label: 'Meter' },
        { to: '/expenses', icon: Wrench, label: 'Service' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen relative pb-24 overflow-hidden">
            {/* Page Transition Wrapper */}
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4"
                >
                    <Outlet />
                </motion.main>
            </AnimatePresence>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-4 left-4 right-4 max-w-[480px] mx-auto glass-panel p-2 flex justify-between items-center z-50">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full p-2 rounded-xl transition-all duration-200 ${isActive
                                ? 'text-primary bg-white/10 scale-105'
                                : 'text-secondary hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={24} />
                        <span className="text-xs mt-1 font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Layout;
