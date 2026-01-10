/**
 * WineCellar - Vue étiquettes de vin avec filtres
 *
 * Fonctionnalités :
 * - Vue grille "étiquettes" visuelles
 * - Filtres : Région, Apogée, Stock
 * - Indicateurs : Score Parker, température service
 * - Badge apogée animé
 */

import { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../utils/supabaseClient';
import {
  Wine,
  Search,
  Filter,
  Thermometer,
  Star,
  Clock,
  MapPin,
  Grape,
  Sparkles,
  AlertTriangle,
  Package,
  ChevronDown,
} from 'lucide-react';

export default function WineCellar() {
  const { businessId } = useBusiness();
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    region: 'all',
    peakStatus: 'all',
    stockStatus: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWine, setSelectedWine] = useState(null);

  useEffect(() => {
    loadWines();
  }, [businessId]);

  const loadWines = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .eq('category', 'wine')
        .order('name');

      setWines(data || []);
    } catch (err) {
      console.error('WineCellar load error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déterminer le statut d'apogée d'un vin
   */
  const getPeakStatus = (wine) => {
    const peak = wine.details?.peak_drink || '';
    const currentYear = new Date().getFullYear();

    if (peak.toLowerCase().includes('now')) {
      return 'ready';
    }

    if (peak.includes('-')) {
      const [start, end] = peak.split('-').map(y => parseInt(y.trim()));
      if (currentYear >= start && currentYear <= end) {
        return 'peak';
      }
      if (currentYear < start) {
        return 'aging';
      }
      if (currentYear > end) {
        return 'past';
      }
    }

    return 'unknown';
  };

  /**
   * Obtenir le statut de stock
   */
  const getStockStatus = (wine) => {
    if (wine.current_stock <= 0) return 'out';
    if (wine.current_stock < wine.min_stock_alert) return 'critical';
    if (wine.current_stock < wine.min_stock_alert * 1.5) return 'low';
    return 'ok';
  };

  // Extraire les régions uniques
  const regions = [...new Set(wines.map(w => w.details?.region).filter(Boolean))];

  // Filtrer les vins
  const filteredWines = wines.filter(wine => {
    // Recherche texte
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = wine.name.toLowerCase().includes(query);
      const matchRegion = wine.details?.region?.toLowerCase().includes(query);
      const matchAppellation = wine.details?.appellation?.toLowerCase().includes(query);
      if (!matchName && !matchRegion && !matchAppellation) return false;
    }

    // Filtre région
    if (filters.region !== 'all' && wine.details?.region !== filters.region) {
      return false;
    }

    // Filtre apogée
    if (filters.peakStatus !== 'all') {
      const status = getPeakStatus(wine);
      if (filters.peakStatus === 'ready' && status !== 'ready' && status !== 'peak') {
        return false;
      }
      if (filters.peakStatus === 'aging' && status !== 'aging') {
        return false;
      }
    }

    // Filtre stock
    if (filters.stockStatus !== 'all') {
      const status = getStockStatus(wine);
      if (filters.stockStatus === 'critical' && status !== 'critical' && status !== 'out') {
        return false;
      }
    }

    return true;
  });

  // Stats
  const readyToServe = wines.filter(w => ['ready', 'peak'].includes(getPeakStatus(w))).length;
  const lowStock = wines.filter(w => ['critical', 'out'].includes(getStockStatus(w))).length;

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-sommelier mb-1">
            <Wine className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-white">{wines.length}</div>
          <div className="text-sm text-slate-400">Références</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-white">{readyToServe}</div>
          <div className="text-sm text-slate-400">En apogée</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-white">{lowStock}</div>
          <div className="text-sm text-slate-400">Stock bas</div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="space-y-4">
        <div className="flex gap-3">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un vin, région, appellation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-900 border border-slate-800
                         text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn h-14 px-4 ${showFilters ? 'bg-sommelier text-white' : 'btn-ghost'}`}
          >
            <Filter className="w-5 h-5" />
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Panneau filtres */}
        {showFilters && (
          <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Région */}
            <div>
              <label className="text-sm text-slate-400 block mb-2">Région</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
                className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700
                           text-white focus:outline-none focus:border-slate-600"
              >
                <option value="all">Toutes les régions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Apogée */}
            <div>
              <label className="text-sm text-slate-400 block mb-2">Apogée</label>
              <select
                value={filters.peakStatus}
                onChange={(e) => setFilters(f => ({ ...f, peakStatus: e.target.value }))}
                className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700
                           text-white focus:outline-none focus:border-slate-600"
              >
                <option value="all">Tous</option>
                <option value="ready">Prêts à servir</option>
                <option value="aging">En vieillissement</option>
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="text-sm text-slate-400 block mb-2">Stock</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters(f => ({ ...f, stockStatus: e.target.value }))}
                className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700
                           text-white focus:outline-none focus:border-slate-600"
              >
                <option value="all">Tous</option>
                <option value="critical">Stock critique</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grille des vins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredWines.map(wine => (
          <WineCard
            key={wine.id}
            wine={wine}
            peakStatus={getPeakStatus(wine)}
            stockStatus={getStockStatus(wine)}
            onClick={() => setSelectedWine(wine)}
          />
        ))}
      </div>

      {filteredWines.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Wine className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucun vin ne correspond à vos critères</p>
        </div>
      )}

      {/* Modal détail vin */}
      {selectedWine && (
        <WineDetailModal
          wine={selectedWine}
          peakStatus={getPeakStatus(selectedWine)}
          onClose={() => setSelectedWine(null)}
        />
      )}
    </div>
  );
}

/**
 * WineCard - Carte "étiquette" de vin
 */
function WineCard({ wine, peakStatus, stockStatus, onClick }) {
  const details = wine.details || {};

  const peakConfig = {
    ready: { badge: 'Prêt', color: 'bg-emerald-600 text-white' },
    peak: { badge: 'Apogée', color: 'bg-amber-500 text-white animate-pulse' },
    aging: { badge: 'Garde', color: 'bg-slate-600 text-slate-300' },
    past: { badge: 'Passé', color: 'bg-red-600/50 text-red-300' },
    unknown: { badge: null, color: '' },
  };

  const peak = peakConfig[peakStatus] || peakConfig.unknown;

  return (
    <button
      onClick={onClick}
      className="wine-card text-left w-full group"
    >
      {/* Header avec vintage */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wine className="w-6 h-6 text-sommelier" />
          {details.vintage && (
            <span className="text-lg font-bold text-white">{details.vintage}</span>
          )}
        </div>
        {peak.badge && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${peak.color}`}>
            {peak.badge}
          </span>
        )}
      </div>

      {/* Nom */}
      <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-rose-300 transition-colors">
        {wine.name}
      </h3>

      {/* Appellation / Région */}
      <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate">
          {details.appellation || details.region || 'Non spécifié'}
        </span>
      </div>

      {/* Cépages */}
      {details.grape && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <Grape className="w-3 h-3" />
          <span className="truncate">
            {Array.isArray(details.grape) ? details.grape.join(', ') : details.grape}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 mt-auto">
        {/* Stock */}
        <div className={`flex items-center gap-1 text-sm
          ${stockStatus === 'critical' || stockStatus === 'out'
            ? 'text-red-400'
            : stockStatus === 'low'
              ? 'text-amber-400'
              : 'text-slate-400'}`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{wine.current_stock} btl</span>
        </div>

        {/* Score Parker */}
        {details.score_parker && (
          <div className="flex items-center gap-1 text-sm text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{details.score_parker}</span>
          </div>
        )}
      </div>

      {/* Emplacement */}
      {wine.storage_area && (
        <div className="text-xs text-slate-500 mt-2 truncate">
          {wine.storage_area}
        </div>
      )}
    </button>
  );
}

/**
 * WineDetailModal - Modal de détail complet du vin
 */
function WineDetailModal({ wine, peakStatus, onClose }) {
  const details = wine.details || {};

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sommelier to-rose-800 flex items-center justify-center">
              <Wine className="w-7 h-7 text-white" />
            </div>
            <div>
              {details.vintage && (
                <span className="text-2xl font-bold text-white">{details.vintage}</span>
              )}
              {peakStatus === 'peak' && (
                <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Apogée
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Nom */}
        <h2 className="text-xl font-bold text-white mb-2">{wine.name}</h2>

        {/* Appellation */}
        <div className="flex items-center gap-2 text-slate-400 mb-6">
          <MapPin className="w-4 h-4" />
          <span>{details.appellation || details.region}</span>
        </div>

        {/* Détails grille */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {details.grape && (
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Grape className="w-4 h-4" />
                Cépages
              </div>
              <p className="text-white text-sm">
                {Array.isArray(details.grape) ? details.grape.join(', ') : details.grape}
              </p>
            </div>
          )}

          {details.peak_drink && (
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Fenêtre
              </div>
              <p className="text-white text-sm">{details.peak_drink}</p>
            </div>
          )}

          {details.serving_temp && (
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Thermometer className="w-4 h-4" />
                Service
              </div>
              <p className="text-white text-sm">{details.serving_temp}</p>
            </div>
          )}

          {details.score_parker && (
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Star className="w-4 h-4" />
                Parker
              </div>
              <p className="text-2xl font-bold text-amber-400">{details.score_parker}</p>
            </div>
          )}
        </div>

        {/* Carafage */}
        {details.decant_time && (
          <div className="card bg-sommelier/10 border-sommelier/30 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-400" />
              <span className="text-rose-300">Carafage recommandé : {details.decant_time}</span>
            </div>
          </div>
        )}

        {/* Stock & Emplacement */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div>
            <p className="text-sm text-slate-400">En stock</p>
            <p className="text-2xl font-bold text-white">{wine.current_stock} bouteilles</p>
          </div>
          {wine.storage_area && (
            <div className="text-right">
              <p className="text-sm text-slate-400">Emplacement</p>
              <p className="text-white">{wine.storage_area}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
