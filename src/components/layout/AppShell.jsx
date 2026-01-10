/**
 * AppShell - Layout principal "Apple-like"
 *
 * Structure :
 * - Sidebar gauche sombre avec navigation dynamique
 * - Profil utilisateur en haut à droite
 * - Zone de contenu principale
 */

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Bell,
  User,
  LogOut,
  ChevronRight,
  Sparkles,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  // Titre de la page actuelle
  const getPageTitle = () => {
    const titles = {
      '/': 'Dashboard',
      '/restaurant': 'Restaurant',
      '/hotel': 'Hôtel',
      '/sommelier': 'Cave & Vins',
      '/stocks': 'Stocks',
      '/clients': 'Clients',
      '/settings': 'Paramètres',
    };
    return titles[location.pathname] || 'HorecaOS';
  };

  // Navigation dynamique selon modules actifs
  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      always: true,
      accent: 'group-[.active]:text-amber-400',
      bgAccent: 'group-[.active]:bg-amber-400/10',
    },
    {
      name: 'Plan de Salle',
      subtitle: 'Service en cours',
      href: '/restaurant',
      icon: UtensilsCrossed,
      enabled: hasRestaurant,
      accent: 'group-[.active]:text-orange-400',
      bgAccent: 'group-[.active]:bg-orange-400/10',
    },
    {
      name: 'Réception',
      subtitle: 'Check-in / Check-out',
      href: '/hotel',
      icon: Hotel,
      enabled: hasHotel,
      accent: 'group-[.active]:text-indigo-400',
      bgAccent: 'group-[.active]:bg-indigo-400/10',
    },
    {
      name: 'Cave Digitale',
      subtitle: 'Sommellerie',
      href: '/sommelier',
      icon: Wine,
      enabled: hasSommelier,
      accent: 'group-[.active]:text-rose-400',
      bgAccent: 'group-[.active]:bg-rose-400/10',
    },
    {
      name: 'Inventaire',
      subtitle: 'Gestion des stocks',
      href: '/stocks',
      icon: Package,
      enabled: hasStock,
      accent: 'group-[.active]:text-emerald-400',
      bgAccent: 'group-[.active]:bg-emerald-400/10',
    },
    {
      name: 'Fichier Clients',
      subtitle: 'CRM & Préférences',
      href: '/clients',
      icon: Users,
      always: true,
      accent: 'group-[.active]:text-cyan-400',
      bgAccent: 'group-[.active]:bg-cyan-400/10',
    },
  ];

  const visibleNav = navigation.filter(item => item.always || item.enabled);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">HorecaOS</h2>
          <p className="text-slate-500">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="card max-w-md text-center py-10">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Erreur de connexion</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <p className="text-sm text-slate-500 bg-slate-800/50 rounded-lg p-4">
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">HorecaOS</h1>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{businessName}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </p>
          {visibleNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                group flex items-center gap-3 px-3 py-3 rounded-xl
                transition-all duration-200 cursor-pointer
                ${isActive
                  ? `active bg-white/5 ${item.bgAccent}`
                  : 'hover:bg-white/5'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-200
                    ${isActive
                      ? 'bg-white/10'
                      : 'bg-slate-800/50 group-hover:bg-slate-800'
                    }
                  `}>
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? item.accent.replace('group-[.active]:', '') : 'text-slate-400 group-hover:text-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {item.name}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Modules actifs */}
        <div className="px-5 py-4 border-t border-slate-800/50">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Modules actifs
          </p>
          <div className="flex flex-wrap gap-2">
            {hasRestaurant && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <UtensilsCrossed className="w-3 h-3" />
                Resto
              </span>
            )}
            {hasHotel && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Hotel className="w-3 h-3" />
                Hôtel
              </span>
            )}
            {hasSommelier && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Wine className="w-3 h-3" />
                Cave
              </span>
            )}
            {hasStock && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                <Package className="w-3 h-3" />
                Stock
              </span>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="p-3 border-t border-slate-800/50">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
              ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}
            `}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Paramètres</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Left: Menu burger (mobile) + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-white">{getPageTitle()}</h2>
            </div>
            <div className="lg:hidden flex items-center gap-2">
              <Crown className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-white">HorecaOS</span>
            </div>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">Manager</p>
                  <p className="text-[11px] text-slate-500">Admin</p>
                </div>
              </button>

              {/* Dropdown Profile */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                      <p className="text-sm font-medium text-white">Manager</p>
                      <p className="text-xs text-slate-400">manager@legrandluxe.fr</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                        <User className="w-4 h-4" />
                        <span className="text-sm">Mon profil</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Préférences</span>
                      </button>
                    </div>
                    <div className="p-2 border-t border-slate-700">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
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
