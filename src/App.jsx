/**
 * HorecaOS - Application principale
 *
 * Architecture :
 * - BusinessProvider : Contexte global (modules, business info)
 * - BrowserRouter : Navigation SPA
 * - AppShell : Layout avec sidebar dynamique
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BusinessProvider } from './context/BusinessContext';
import AppShell from './components/layout/AppShell';
import DashboardHome from './pages/DashboardHome';
import RestaurantPage from './pages/RestaurantPage';
import HotelPage from './pages/HotelPage';
import SommelierPage from './pages/SommelierPage';
import StocksPage from './pages/StocksPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <BusinessProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/restaurant" element={<RestaurantPage />} />
            <Route path="/hotel" element={<HotelPage />} />
            <Route path="/sommelier" element={<SommelierPage />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BusinessProvider>
  );
}

export default App;
