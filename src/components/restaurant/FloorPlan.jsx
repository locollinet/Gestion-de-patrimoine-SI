/**
 * FloorPlan - Plan de salle graphique interactif
 *
 * Affiche les tables sous forme de grille visuelle par zone :
 * - Salle principale
 * - Terrasse
 * - Salons privés
 *
 * Touch-First : grandes zones cliquables, feedback visuel immédiat
 */

import { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../utils/supabaseClient';
import {
  Users,
  Clock,
  Crown,
  AlertTriangle,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function FloorPlan({ onTableSelect }) {
  const { businessId } = useBusiness();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('all');

  useEffect(() => {
    loadFloorData();
    // Refresh toutes les 30 secondes
    const interval = setInterval(loadFloorData, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadFloorData = async () => {
    try {
      // Charger tables et commandes en parallèle
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

      // Mapper les commandes par table_id
      const ordersMap = {};
      (ordersRes.data || []).forEach(order => {
        if (order.table_id) {
          ordersMap[order.table_id] = order;
        }
      });
      setOrders(ordersMap);
    } catch (err) {
      console.error('FloorPlan load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les tables par zone
  const zones = {
    salle: { name: 'Salle', icon: '🍽️', tables: [] },
    terrasse: { name: 'Terrasse', icon: '☀️', tables: [] },
    salon_prive: { name: 'Salons Privés', icon: '🥂', tables: [] },
  };

  tables.forEach(table => {
    const zone = table.zone || 'salle';
    if (zones[zone]) {
      zones[zone].tables.push(table);
    }
  });

  const filteredZones = selectedZone === 'all'
    ? Object.entries(zones)
    : Object.entries(zones).filter(([key]) => key === selectedZone);

  // Stats rapides
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-400">
              Libres: {totalTables - occupiedTables - reservedTables}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-resto"></div>
            <span className="text-sm text-slate-400">
              Occupées: {occupiedTables}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-sm text-slate-400">
              Réservées: {reservedTables}
            </span>
          </div>
        </div>

        <button
          onClick={loadFloorData}
          className="btn btn-ghost h-10 px-3"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Zone Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedZone('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
            ${selectedZone === 'all'
              ? 'bg-resto text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          Toutes les zones
        </button>
        {Object.entries(zones).map(([key, zone]) => (
          <button
            key={key}
            onClick={() => setSelectedZone(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${selectedZone === key
                ? 'bg-resto text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            {zone.icon} {zone.name} ({zone.tables.length})
          </button>
        ))}
      </div>

      {/* Floor Plan Grid */}
      {filteredZones.map(([zoneKey, zone]) => (
        <div key={zoneKey} className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>{zone.icon}</span>
            {zone.name}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {zone.tables.map(table => (
              <TableTile
                key={table.id}
                table={table}
                order={orders[table.id]}
                onSelect={() => onTableSelect?.(table, orders[table.id])}
              />
            ))}

            {zone.tables.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                Aucune table dans cette zone
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * TableTile - Tuile individuelle de table
 */
function TableTile({ table, order, onSelect }) {
  const customer = order?.customer;
  const isVIP = customer?.is_vip;
  const hasAllergies = customer?.preferences?.allergies?.length > 0;

  // Calculer le temps depuis l'ouverture de la commande
  const getElapsedTime = () => {
    if (!order?.created_at) return null;
    const start = new Date(order.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - start) / 60000);
    return diffMinutes;
  };

  const elapsedTime = getElapsedTime();

  // Classe de status
  const statusClasses = {
    free: 'table-free',
    occupied: 'table-occupied',
    reserved: 'table-reserved',
  };

  return (
    <button
      onClick={onSelect}
      className={`
        table-tile w-full min-h-[140px] p-3 relative
        ${statusClasses[table.status] || 'table-free'}
      `}
    >
      {/* Badges VIP / Allergie en haut */}
      {(isVIP || hasAllergies) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {isVIP && (
            <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </span>
          )}
          {hasAllergies && (
            <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-3 h-3 text-white" />
            </span>
          )}
        </div>
      )}

      {/* Nom de la table */}
      <div className="text-xl font-bold mb-1">{table.name}</div>

      {/* Capacité */}
      <div className="flex items-center gap-1 text-sm opacity-70 mb-2">
        <Users className="w-3.5 h-3.5" />
        <span>{table.capacity}</span>
      </div>

      {/* Info client si occupée */}
      {table.status === 'occupied' && customer && (
        <div className="text-xs truncate opacity-80">
          {customer.full_name}
        </div>
      )}

      {/* Temps écoulé */}
      {table.status === 'occupied' && elapsedTime !== null && (
        <div className={`
          flex items-center gap-1 text-xs mt-1
          ${elapsedTime > 90 ? 'text-red-400' : elapsedTime > 60 ? 'text-amber-400' : 'opacity-60'}
        `}>
          <Clock className="w-3 h-3" />
          <span>{elapsedTime} min</span>
        </div>
      )}

      {/* Status réservé */}
      {table.status === 'reserved' && (
        <div className="text-xs opacity-70 mt-1">Réservée</div>
      )}

      {/* Bouton nouvelle commande si libre */}
      {table.status === 'free' && (
        <div className="mt-2 text-xs flex items-center gap-1 opacity-60">
          <Plus className="w-3 h-3" />
          <span>Ouvrir</span>
        </div>
      )}
    </button>
  );
}
