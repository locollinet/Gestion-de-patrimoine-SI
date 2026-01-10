/**
 * DashboardHome - Vue "Cockpit" principale
 *
 * Design Bento Grid avec KPIs visuels premium
 * - Hôtel : Taux d'occupation, Arrivées/Départs
 * - Restaurant : CA du service, Couverts, Tables
 * - Stock : Alertes critiques
 * - Sommelier : Vins en apogée
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../utils/supabaseClient';
import {
  Hotel,
  UtensilsCrossed,
  Wine,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Crown,
  DoorOpen,
  DoorClosed,
  AlertCircle,
  Sparkles,
  Euro,
  Activity,
  Zap,
  ChefHat,
  Bed,
  GlassWater,
} from 'lucide-react';

export default function DashboardHome() {
  const { hasHotel, hasRestaurant, hasSommelier, hasStock, businessId, businessName } = useBusiness();

  const [hotelStats, setHotelStats] = useState(null);
  const [restaurantStats, setRestaurantStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [winesPeak, setWinesPeak] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [businessId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const promises = [];
      if (hasHotel) promises.push(loadHotelStats());
      if (hasRestaurant) promises.push(loadRestaurantStats());
      if (hasStock) promises.push(loadStockAlerts());
      if (hasSommelier) promises.push(loadWinesPeak());
      await Promise.all(promises);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHotelStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('business_id', businessId);

    const checkedIn = bookings?.filter(b => b.status === 'checked_in') || [];
    const arrivalsToday = bookings?.filter(b => b.check_in === today && b.status === 'confirmed') || [];
    const departuresToday = bookings?.filter(b => b.check_out === today && b.status === 'checked_in') || [];

    const totalRooms = 20;
    setHotelStats({
      occupancyRate: Math.round((checkedIn.length / totalRooms) * 100),
      occupiedRooms: checkedIn.length,
      totalRooms,
      arrivalsToday: arrivalsToday.length,
      departuresToday: departuresToday.length,
    });
  };

  const loadRestaurantStats = async () => {
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .eq('business_id', businessId);

    const occupiedTables = tables?.filter(t => t.status === 'occupied') || [];

    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('business_id', businessId)
      .in('status', ['open', 'in_progress']);

    let currentRevenue = 0;
    let covers = 0;
    orders?.forEach(order => {
      covers += order.covers || 1;
      order.order_items?.forEach(item => {
        currentRevenue += (item.unit_price || 0) * (item.quantity || 1);
      });
    });

    setRestaurantStats({
      occupiedTables: occupiedTables.length,
      totalTables: tables?.length || 0,
      activeOrders: orders?.length || 0,
      currentRevenue,
      covers,
    });
  };

  const loadStockAlerts = async () => {
    const { data: allProducts } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId);

    const alerts = allProducts?.filter(p => p.current_stock < p.min_stock_alert) || [];
    setStockAlerts(alerts.slice(0, 5));
  };

  const loadWinesPeak = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('category', 'wine')
      .order('current_stock', { ascending: false })
      .limit(4);

    const currentYear = new Date().getFullYear();
    const peakWines = data?.filter(wine => {
      const peak = wine.details?.peak_drink || '';
      return peak.toLowerCase().includes('now') ||
             (peak.includes('-') && parseInt(peak.split('-')[0]) <= currentYear);
    }) || [];

    setWinesPeak(peakWines.slice(0, 4));
  };

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Bonjour', emoji: '☀️' };
    if (hour < 14) return { text: 'Bon appétit', emoji: '🍽️' };
    if (hour < 18) return { text: 'Bon après-midi', emoji: '⛅' };
    if (hour < 22) return { text: 'Bonsoir', emoji: '🌙' };
    return { text: 'Bonne nuit', emoji: '🌟' };
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentTime]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with greeting */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm mb-1 capitalize">{formattedDate}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {greeting.text} {greeting.emoji}
          </h1>
          <p className="text-slate-400 mt-1">
            Bienvenue dans votre cockpit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-emerald-400 font-medium">Live</span>
          </div>
          <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-lg font-mono text-white">{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hasHotel && hotelStats && (
          <QuickStat
            icon={Bed}
            label="Occupation"
            value={`${hotelStats.occupancyRate}%`}
            color="indigo"
            trend={hotelStats.occupancyRate > 70 ? 'up' : 'neutral'}
          />
        )}
        {hasRestaurant && restaurantStats && (
          <>
            <QuickStat
              icon={Euro}
              label="CA Service"
              value={`${restaurantStats.currentRevenue.toLocaleString('fr-FR')}€`}
              color="orange"
              trend="up"
            />
            <QuickStat
              icon={Users}
              label="Couverts"
              value={restaurantStats.covers}
              color="cyan"
            />
          </>
        )}
        {hasStock && (
          <QuickStat
            icon={AlertTriangle}
            label="Alertes Stock"
            value={stockAlerts.length}
            color={stockAlerts.length > 0 ? 'red' : 'emerald'}
            pulse={stockAlerts.length > 0}
          />
        )}
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotel Section - 2 columns */}
        {hasHotel && hotelStats && (
          <div className="lg:col-span-2 space-y-4">
            <SectionHeader icon={Hotel} title="Réception" color="indigo" href="/hotel" />
            <div className="grid grid-cols-3 gap-4">
              {/* Main Occupancy Card */}
              <div className="col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <p className="text-slate-400 text-sm mb-2">Taux d'occupation</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{hotelStats.occupancyRate}</span>
                    <span className="text-2xl text-indigo-400">%</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${hotelStats.occupancyRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500">
                      {hotelStats.occupiedRooms}/{hotelStats.totalRooms}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrivals & Departures */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <DoorOpen className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-sm text-slate-400">Arrivées</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{hotelStats.arrivalsToday}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <DoorClosed className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-sm text-slate-400">Départs</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{hotelStats.departuresToday}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Section */}
        {hasRestaurant && restaurantStats && (
          <div className={hasHotel ? 'lg:col-span-1' : 'lg:col-span-2'}>
            <SectionHeader icon={UtensilsCrossed} title="Service" color="orange" href="/restaurant" />
            <div className="mt-4 space-y-4">
              {/* Revenue Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-600/20 via-slate-900 to-slate-900 border border-orange-500/20 rounded-2xl p-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-sm">Chiffre d'affaires</p>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      En cours
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {restaurantStats.currentRevenue.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xl text-orange-400">€</span>
                  </div>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Commandes</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{restaurantStats.activeOrders}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UtensilsCrossed className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Tables</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    <span className="text-orange-400">{restaurantStats.occupiedTables}</span>
                    <span className="text-slate-500 text-lg">/{restaurantStats.totalTables}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alerts */}
        {hasStock && stockAlerts.length > 0 && (
          <div className="lg:col-span-2">
            <SectionHeader
              icon={AlertTriangle}
              title="Alertes Stock"
              color="red"
              href="/stocks"
              badge={stockAlerts.length}
              pulse
            />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockAlerts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl hover:border-red-500/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{product.name}</h4>
                      <p className="text-sm text-slate-500">{product.storage_area}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-400">{product.current_stock}</p>
                    <p className="text-xs text-slate-500">min: {product.min_stock_alert}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sommelier - Wines at Peak */}
        {hasSommelier && winesPeak.length > 0 && (
          <div className={stockAlerts.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <SectionHeader icon={Wine} title="Prêts à Servir" color="rose" href="/sommelier" />
            <div className={`mt-4 grid gap-4 ${stockAlerts.length > 0 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'}`}>
              {winesPeak.map((wine) => (
                <div
                  key={wine.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-rose-900/30 via-slate-900 to-slate-900 border border-rose-500/20 rounded-2xl p-4 hover:border-rose-500/40 transition-all"
                >
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Apogée
                    </span>
                  </div>
                  <Wine className="w-8 h-8 text-rose-400 mb-3" />
                  <h4 className="font-medium text-white line-clamp-2 mb-1">{wine.name}</h4>
                  <p className="text-sm text-slate-500 mb-3">
                    {wine.details?.vintage || 'NV'} • {wine.details?.appellation || wine.details?.region}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-sm text-slate-400">{wine.current_stock} btl</span>
                    <span className="text-xs text-rose-400">{wine.details?.peak_drink}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIP Clients Section */}
      <VIPClientsSection businessId={businessId} />
    </div>
  );
}

// Quick Stat Component
function QuickStat({ icon: Icon, label, value, color, trend, pulse }) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-4`}>
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      <Icon className="w-5 h-5 mb-2 opacity-60" />
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ icon: Icon, title, color, href, badge, pulse }) {
  const colorClasses = {
    indigo: 'text-indigo-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    rose: 'text-rose-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {badge !== undefined && (
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            pulse ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
          }`}>
            {badge}
          </span>
        )}
      </div>
      {href && (
        <Link
          to={href}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Voir tout
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// VIP Clients Section
function VIPClientsSection({ businessId }) {
  const [vipClients, setVipClients] = useState([]);

  useEffect(() => {
    loadVIPClients();
  }, [businessId]);

  const loadVIPClients = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_vip', true)
      .order('total_spent', { ascending: false })
      .limit(4);
    setVipClients(data || []);
  };

  if (vipClients.length === 0) return null;

  return (
    <section>
      <SectionHeader icon={Crown} title="Clients VIP" color="orange" href="/clients" />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vipClients.map((client) => (
          <div
            key={client.id}
            className="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>

            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-500/20">
                {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                <Crown className="w-3 h-3" />
                VIP
              </span>
            </div>

            <h3 className="font-semibold text-white mb-1">{client.full_name}</h3>
            <p className="text-sm text-slate-500 mb-4">{client.total_visits} visites</p>

            {/* Allergies */}
            {client.preferences?.allergies?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {client.preferences.allergies.slice(0, 2).map((allergy, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium rounded-full"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {allergy}
                  </span>
                ))}
                {client.preferences.allergies.length > 2 && (
                  <span className="text-xs text-slate-500 self-center">
                    +{client.preferences.allergies.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
