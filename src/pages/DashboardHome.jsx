/**
 * DashboardHome - Vue "Cockpit" principale
 *
 * KPIs affichés :
 * - Hôtel : Taux d'occupation, Arrivées/Départs du jour
 * - Restaurant : CA du service, Couverts, Tables occupées
 * - Stock : Alertes critiques
 * - Sommelier : Vins en apogée
 *
 * Design : Grilles de cartes, pas de tableaux
 */

import { useEffect, useState } from 'react';
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
  Calendar,
  Clock,
  ArrowRight,
  Crown,
  DoorOpen,
  DoorClosed,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function DashboardHome() {
  const { hasHotel, hasRestaurant, hasSommelier, hasStock, businessId } = useBusiness();

  const [hotelStats, setHotelStats] = useState(null);
  const [restaurantStats, setRestaurantStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [winesPeak, setWinesPeak] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [businessId]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // Charger toutes les données en parallèle
      const promises = [];

      if (hasHotel) {
        promises.push(loadHotelStats());
      }
      if (hasRestaurant) {
        promises.push(loadRestaurantStats());
      }
      if (hasStock) {
        promises.push(loadStockAlerts());
      }
      if (hasSommelier) {
        promises.push(loadWinesPeak());
      }

      await Promise.all(promises);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHotelStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Réservations actives
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('business_id', businessId);

    const checkedIn = bookings?.filter(b => b.status === 'checked_in') || [];
    const arrivalsToday = bookings?.filter(b => b.check_in === today && b.status === 'confirmed') || [];
    const departuresToday = bookings?.filter(b => b.check_out === today && b.status === 'checked_in') || [];

    // Simulation de 20 chambres totales
    const totalRooms = 20;
    const occupancyRate = Math.round((checkedIn.length / totalRooms) * 100);

    setHotelStats({
      occupancyRate,
      occupiedRooms: checkedIn.length,
      totalRooms,
      arrivalsToday: arrivalsToday.length,
      departuresToday: departuresToday.length,
    });
  };

  const loadRestaurantStats = async () => {
    // Tables
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .eq('business_id', businessId);

    const occupiedTables = tables?.filter(t => t.status === 'occupied') || [];
    const totalSeats = tables?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 0;

    // Commandes en cours
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('business_id', businessId)
      .in('status', ['open', 'in_progress']);

    // Calcul du CA approximatif
    let currentRevenue = 0;
    orders?.forEach(order => {
      order.order_items?.forEach(item => {
        currentRevenue += (item.unit_price || 0) * (item.quantity || 1);
      });
    });

    setRestaurantStats({
      occupiedTables: occupiedTables.length,
      totalTables: tables?.length || 0,
      activeOrders: orders?.length || 0,
      currentRevenue,
      totalSeats,
    });
  };

  const loadStockAlerts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .lt('current_stock', supabase.rpc('min_stock_alert'))
      .order('current_stock', { ascending: true })
      .limit(5);

    // Fallback: charger tous les produits et filtrer
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

    // Filtrer les vins en apogée (peak_drink contient "Now" ou l'année actuelle)
    const currentYear = new Date().getFullYear();
    const peakWines = data?.filter(wine => {
      const peak = wine.details?.peak_drink || '';
      return peak.toLowerCase().includes('now') ||
             (peak.includes('-') && parseInt(peak.split('-')[0]) <= currentYear);
    }) || [];

    setWinesPeak(peakWines.slice(0, 4));
  };

  // Heure actuelle pour le greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {getGreeting()} !
        </h1>
        <p className="text-slate-400">
          Vue d'ensemble de votre établissement
        </p>
      </div>

      {/* KPI Grid - Hôtel */}
      {hasHotel && hotelStats && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Hotel className="w-5 h-5 text-hotel" />
            <h2 className="text-lg font-semibold text-white">Hôtel</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Taux d'occupation */}
            <div className="kpi-card col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Occupation</span>
                <TrendingUp className="w-4 h-4 text-hotel" />
              </div>
              <div className="kpi-value text-hotel">{hotelStats.occupancyRate}%</div>
              <div className="text-sm text-slate-500">
                {hotelStats.occupiedRooms}/{hotelStats.totalRooms} chambres
              </div>
            </div>

            {/* Arrivées */}
            <div className="kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Arrivées</span>
                <DoorOpen className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="kpi-value text-emerald-400">{hotelStats.arrivalsToday}</div>
              <div className="text-sm text-slate-500">aujourd'hui</div>
            </div>

            {/* Départs */}
            <div className="kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Départs</span>
                <DoorClosed className="w-4 h-4 text-amber-500" />
              </div>
              <div className="kpi-value text-amber-400">{hotelStats.departuresToday}</div>
              <div className="text-sm text-slate-500">aujourd'hui</div>
            </div>

            {/* Lien rapide */}
            <Link to="/hotel" className="kpi-card card-hover group">
              <div className="flex items-center justify-between h-full">
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Voir les réservations
                </span>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-hotel transition-colors" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* KPI Grid - Restaurant */}
      {hasRestaurant && restaurantStats && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="w-5 h-5 text-resto" />
            <h2 className="text-lg font-semibold text-white">Restaurant</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CA Service */}
            <div className="kpi-card col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">CA Service</span>
                <TrendingUp className="w-4 h-4 text-resto" />
              </div>
              <div className="kpi-value text-resto">
                {restaurantStats.currentRevenue.toLocaleString('fr-FR')} €
              </div>
              <div className="text-sm text-slate-500">en cours</div>
            </div>

            {/* Tables occupées */}
            <div className="kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Tables</span>
                <UtensilsCrossed className="w-4 h-4 text-slate-400" />
              </div>
              <div className="kpi-value text-white">
                {restaurantStats.occupiedTables}/{restaurantStats.totalTables}
              </div>
              <div className="text-sm text-slate-500">occupées</div>
            </div>

            {/* Commandes actives */}
            <div className="kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Commandes</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="kpi-value text-white">{restaurantStats.activeOrders}</div>
              <div className="text-sm text-slate-500">en cours</div>
            </div>

            {/* Lien plan de salle */}
            <Link to="/restaurant" className="kpi-card card-hover group">
              <div className="flex items-center justify-between h-full">
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Plan de salle
                </span>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-resto transition-colors" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Alertes Stock */}
      {hasStock && stockAlerts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-danger animate-pulse" />
            <h2 className="text-lg font-semibold text-white">Alertes Stock</h2>
            <span className="badge-stock-critical ml-2">{stockAlerts.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockAlerts.map((product) => (
              <div key={product.id} className="card border-red-600/50 bg-red-600/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white mb-1">{product.name}</h3>
                    <p className="text-sm text-slate-400">{product.storage_area}</p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-danger">
                    {product.current_stock}
                  </span>
                  <span className="text-slate-500">/ {product.min_stock_alert} {product.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vins en Apogée */}
      {hasSommelier && winesPeak.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Vins en Apogée</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {winesPeak.map((wine) => (
              <div key={wine.id} className="wine-card">
                <div className="flex items-start justify-between mb-3">
                  <Wine className="w-6 h-6 text-sommelier" />
                  <span className="text-xs text-slate-500">
                    {wine.details?.vintage || 'NV'}
                  </span>
                </div>
                <h3 className="font-medium text-white mb-1 line-clamp-2">
                  {wine.name}
                </h3>
                <p className="text-sm text-slate-400 mb-2">
                  {wine.details?.appellation || wine.details?.region}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700">
                  <span className="text-sm text-slate-300">
                    {wine.current_stock} btl
                  </span>
                  <span className="text-xs text-amber-400">
                    {wine.details?.peak_drink}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/sommelier"
            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Voir toute la cave
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* Clients VIP récents */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Clients VIP</h2>
        </div>
        <VIPClientsWidget businessId={businessId} />
      </section>
    </div>
  );
}

// Widget clients VIP
function VIPClientsWidget({ businessId }) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {vipClients.map((client) => (
        <div key={client.id} className="card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
              {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <span className="badge-vip">
              <Crown className="w-3 h-3" />
              VIP
            </span>
          </div>
          <h3 className="font-medium text-white mb-1">{client.full_name}</h3>
          <p className="text-sm text-slate-400 mb-3">
            {client.total_visits} visites
          </p>

          {/* Allergies */}
          {client.preferences?.allergies?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {client.preferences.allergies.slice(0, 2).map((allergy, i) => (
                <span key={i} className="badge-allergy text-[10px]">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {allergy}
                </span>
              ))}
              {client.preferences.allergies.length > 2 && (
                <span className="text-xs text-slate-500">
                  +{client.preferences.allergies.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
