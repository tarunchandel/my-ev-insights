import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Charging from './pages/Charging';
import Stats from './pages/Stats';
import Meter from './pages/Meter';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import { App as CapApp } from '@capacitor/app';

const NativeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = async () => {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (location.pathname === '/') {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });
    };
    handleBackButton();

    return () => {
      CapApp.removeAllListeners();
    };
  }, [location, navigate]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <NativeNavigation />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="charging" element={<Charging />} />
            <Route path="stats" element={<Stats />} />
            <Route path="meter" element={<Meter />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
