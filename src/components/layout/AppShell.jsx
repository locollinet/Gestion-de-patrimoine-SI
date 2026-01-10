/**
 * AppShell - Layout principal de l'application
 *
 * Structure :
 * - Sidebar gauche (navigation dynamique selon modules)
 * - Zone de contenu principale
 * - Header avec infos business
 *
 * Touch-First : Sidebar collapsible sur mobile/tablette
 */

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Hotel,
  Wine,
  Package,
  Users,
  Settings,
  Menu,
  X,
  Crown,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function AppShell() {
  const {
    businessName,
    hasHotel,
    hasRestaurant,
    hasSommelier,
    hasStock,
    loading,
    error
  } = useBusiness();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Configuration de la navigation selon les modules actifs
  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      always: true,
      accent: 'text-slate-300',
    },
    {
      name: 'Restaurant',
      href: '/restaurant',
      icon: UtensilsCrossed,
      enabled: hasRestaurant,
      accent: 'text-resto',
    },
    {
      name: 'Hôtel',
      href: '/hotel',
      icon: Hotel,
      enabled: hasHotel,
      accent: 'text-hotel',
    },
    {
      name: 'Cave & Vins',
      href: '/sommelier',
      icon: Wine,
      enabled: hasSommelier,
      accent: 'text-rose-400',
    },
    {
      name: 'Stocks',
      href: '/stocks',
      icon: Package,
      enabled: hasStock,
      accent: 'text-slate-300',
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Users,
      always: true,
      accent: 'text-slate-300',
    },
  ];

  // Filtrer les items de navigation visibles
  const visibleNav = navigation.filter(item => item.always || item.enabled);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-hotel animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de HorecaOS...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur de connexion</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-sm text-slate-500">
            Vérifiez que le script SQL Magic Seed a été exécuté.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-resto to-sommelier flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">HorecaOS</h1>
              <p className="text-xs text-slate-500 truncate max-w-[140px]">{businessName}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                nav-item
                ${isActive ? 'nav-item-active' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? item.accent : ''}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar - Modules actifs */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Modules actifs</p>
          <div className="flex flex-wrap gap-2">
            {hasRestaurant && (
              <span className="px-2 py-1 rounded text-xs bg-resto/20 text-resto">
                Restaurant
              </span>
            )}
            {hasHotel && (
              <span className="px-2 py-1 rounded text-xs bg-hotel/20 text-hotel">
                Hôtel
              </span>
            )}
            {hasSommelier && (
              <span className="px-2 py-1 rounded text-xs bg-sommelier/20 text-rose-300">
                Sommelier
              </span>
            )}
            {hasStock && (
              <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                Stock
              </span>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-slate-800">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <Settings className="w-5 h-5" />
            <span>Paramètres</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar Mobile */}
        <header className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-resto" />
            <span className="font-semibold text-white">HorecaOS</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
