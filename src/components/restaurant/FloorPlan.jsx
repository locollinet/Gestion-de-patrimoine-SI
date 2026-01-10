/**
 * FloorPlan - Plan de salle graphique interactif
 *
 * Design premium touch-first avec :
 * - Tables rondes/carrées selon capacité
 * - Indicateurs VIP et allergies
 * - Timer coloré par durée
 * - Zones visuellement distinctes
 */

import { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../utils/supabaseClient';
import {
  Users,
  Clock,
  Crown,
  AlertTriangle,
  Plus,
  RefreshCw,
  Utensils,
  Sun,
  Sparkles,
  ChefHat,
  CircleDot,
  Square,
  Timer,
  Euro,
} from 'lucide-react';

export default function FloorPlan({ onTableSelect }) {
  const { businessId } = useBusiness();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadFloorData();
    const interval = setInterval(loadFloorData, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadFloorData = async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        supabase
          .from('tables')
          .select('*')
          .eq('business_id', businessId)
          .order('name'),
        supabase
          .from('orders')
          .select(`
            *,
            customer:customers(*),
            order_items(*)
          `)
          .eq('business_id', businessId)
          .in('status', ['open', 'in_progress'])
      ]);

      setTables(tablesRes.data || []);

      const ordersMap = {};
      (ordersRes.data || []).forEach(order => {
        if (order.table_id) {
          ordersMap[order.table_id] = order;
        }
      });
      setOrders(ordersMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('FloorPlan load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Zone configuration with styling
  const zoneConfig = {
    salle: {
      name: 'Salle Principale',
      icon: Utensils,
      color: 'orange',
      gradient: 'from-orange-500/10 to-transparent',
    },
    terrasse: {
      name: 'Terrasse',
      icon: Sun,
      color: 'emerald',
      gradient: 'from-emerald-500/10 to-transparent',
    },
    salon_prive: {
      name: 'Salons Privés',
      icon: Sparkles,
      color: 'purple',
      gradient: 'from-purple-500/10 to-transparent',
    },
  };

  // Group tables by zone
  const zones = useMemo(() => {
    const grouped = {
      salle: [],
      terrasse: [],
      salon_prive: [],
    };
    tables.forEach(table => {
      const zone = table.zone || 'salle';
      if (grouped[zone]) {
        grouped[zone].push(table);
      }
    });
    return grouped;
  }, [tables]);

  // Stats
  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const free = total - occupied - reserved;

    // Calculate revenue
    let revenue = 0;
    Object.values(orders).forEach(order => {
      order.order_items?.forEach(item => {
        revenue += (item.unit_price || 0) * (item.quantity || 1);
      });
    });

    return { total, occupied, reserved, free, revenue };
  }, [tables, orders]);

  const filteredZones = selectedZone === 'all'
    ? Object.entries(zones)
    : Object.entries(zones).filter(([key]) => key === selectedZone);

  return (
    <div className="space-y-6">
      {/* Header Stats Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stats Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <StatPill
              color="emerald"
              label="Libres"
              value={stats.free}
              icon={CircleDot}
            />
            <StatPill
              color="orange"
              label="Occupées"
              value={stats.occupied}
              icon={Users}
            />
            <StatPill
              color="amber"
              label="Réservées"
              value={stats.reserved}
              icon={Clock}
            />
            <div className="hidden md:block h-8 w-px bg-slate-700" />
            <StatPill
              color="cyan"
              label="CA Service"
              value={`${stats.revenue.toLocaleString('fr-FR')}€`}
              icon={Euro}
              large
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">
              Màj {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={loadFloorData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:block">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zone Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <ZoneTab
          active={selectedZone === 'all'}
          onClick={() => setSelectedZone('all')}
          label="Toutes les zones"
          count={stats.total}
        />
        {Object.entries(zoneConfig).map(([key, config]) => (
          <ZoneTab
            key={key}
            active={selectedZone === key}
            onClick={() => setSelectedZone(key)}
            label={config.name}
            count={zones[key]?.length || 0}
            icon={config.icon}
            color={config.color}
          />
        ))}
      </div>

      {/* Floor Plan Zones */}
      <div className="space-y-8">
        {filteredZones.map(([zoneKey, zoneTables]) => {
          const config = zoneConfig[zoneKey];
          const Icon = config.icon;

          return (
            <section
              key={zoneKey}
              className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br ${config.gradient} p-6`}
            >
              {/* Zone Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-${config.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${config.color}-400`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                  <p className="text-sm text-slate-500">{zoneTables.length} tables</p>
                </div>
              </div>

              {/* Tables Grid */}
              {zoneTables.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {zoneTables.map(table => (
                    <TableTile
                      key={table.id}
                      table={table}
                      order={orders[table.id]}
                      onSelect={() => onTableSelect?.(table, orders[table.id])}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Square className="w-12 h-12 mb-3 opacity-30" />
                  <p>Aucune table dans cette zone</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/**
 * StatPill - Compact stat indicator
 */
function StatPill({ color, label, value, icon: Icon, large }) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClasses[color]}`}>
      <Icon className="w-4 h-4 opacity-70" />
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`font-bold ${large ? 'text-lg' : 'text-sm'}`}>{value}</span>
    </div>
  );
}

/**
 * ZoneTab - Zone filter button
 */
function ZoneTab({ active, onClick, label, count, icon: Icon, color }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
        transition-all active:scale-95
        ${active
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
        }
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
      <span className={`px-1.5 py-0.5 rounded-md text-xs ${active ? 'bg-white/20' : 'bg-slate-700'}`}>
        {count}
      </span>
    </button>
  );
}

/**
 * TableTile - Individual table card with visual indicators
 */
function TableTile({ table, order, onSelect }) {
  const customer = order?.customer;
  const isVIP = customer?.is_vip;
  const hasAllergies = customer?.preferences?.allergies?.length > 0;
  const allergies = customer?.preferences?.allergies || [];

  // Calculate elapsed time
  const elapsedTime = useMemo(() => {
    if (!order?.created_at) return null;
    const start = new Date(order.created_at);
    const now = new Date();
    return Math.floor((now - start) / 60000);
  }, [order?.created_at]);

  // Calculate order total
  const orderTotal = useMemo(() => {
    if (!order?.order_items) return 0;
    return order.order_items.reduce((sum, item) =>
      sum + (item.unit_price || 0) * (item.quantity || 1), 0);
  }, [order?.order_items]);

  // Time urgency color
  const getTimeColor = () => {
    if (elapsedTime === null) return '';
    if (elapsedTime > 90) return 'text-red-400';
    if (elapsedTime > 60) return 'text-amber-400';
    return 'text-slate-400';
  };

  // Status styling
  const statusStyles = {
    free: {
      border: 'border-emerald-500/30 hover:border-emerald-400',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
    },
    occupied: {
      border: 'border-orange-500/30 hover:border-orange-400',
      bg: 'bg-orange-500/5 hover:bg-orange-500/10',
      text: 'text-orange-400',
      ring: 'ring-orange-500/20',
    },
    reserved: {
      border: 'border-amber-500/30 hover:border-amber-400',
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      text: 'text-amber-400',
      ring: 'ring-amber-500/20',
    },
  };

  const style = statusStyles[table.status] || statusStyles.free;

  // Table shape based on capacity
  const isRound = table.capacity <= 4;

  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full aspect-square
        flex flex-col items-center justify-center
        border-2 ${style.border} ${style.bg}
        ${isRound ? 'rounded-full' : 'rounded-2xl'}
        transition-all duration-200 active:scale-95
        hover:shadow-lg hover:shadow-slate-900/50
        focus:outline-none focus:ring-2 ${style.ring}
      `}
    >
      {/* VIP / Allergy Badges */}
      {(isVIP || hasAllergies) && (
        <div className="absolute -top-1 -right-1 flex gap-1">
          {isVIP && (
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-slate-900">
              <Crown className="w-3.5 h-3.5 text-white" />
            </span>
          )}
          {hasAllergies && (
            <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-slate-900 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
            </span>
          )}
        </div>
      )}

      {/* Table Number */}
      <span className={`text-2xl font-bold ${style.text} group-hover:scale-110 transition-transform`}>
        {table.name}
      </span>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
        <Users className="w-3.5 h-3.5" />
        <span>{table.capacity}</span>
      </div>

      {/* Occupied Info */}
      {table.status === 'occupied' && (
        <div className="absolute bottom-2 left-2 right-2">
          {/* Customer Name */}
          {customer && (
            <p className="text-xs text-slate-400 truncate text-center mb-1">
              {customer.full_name}
            </p>
          )}

          {/* Time & Amount */}
          <div className="flex items-center justify-center gap-3 text-xs">
            {elapsedTime !== null && (
              <span className={`flex items-center gap-1 ${getTimeColor()}`}>
                <Timer className="w-3 h-3" />
                {elapsedTime}m
              </span>
            )}
            {orderTotal > 0 && (
              <span className="text-slate-400">
                {orderTotal.toLocaleString('fr-FR')}€
              </span>
            )}
          </div>
        </div>
      )}

      {/* Reserved Badge */}
      {table.status === 'reserved' && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
            Réservée
          </span>
        </div>
      )}

      {/* Free - Open Action */}
      {table.status === 'free' && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-full shadow-lg">
            <Plus className="w-3 h-3" />
            Ouvrir
          </span>
        </div>
      )}

      {/* Allergen Tooltip on hover */}
      {hasAllergies && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none">
          <div className="px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {allergies.slice(0, 2).join(', ')}
              {allergies.length > 2 && ` +${allergies.length - 2}`}
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
