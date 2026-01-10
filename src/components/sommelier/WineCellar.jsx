/**
 * WineCellar - Cave digitale premium
 *
 * Fonctionnalités :
 * - Vue "étiquettes" visuelles élégantes
 * - Filtres intelligents : Région, Apogée, Stock
 * - Score Parker, température, carafage
 * - Badge apogée doré animé
 */

import { useState, useEffect, useMemo } from 'react';
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
  X,
  Droplets,
  Award,
  RefreshCw,
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

  const getPeakStatus = (wine) => {
    const peak = wine.details?.peak_drink || '';
    const currentYear = new Date().getFullYear();

    if (peak.toLowerCase().includes('now')) return 'ready';
    if (peak.includes('-')) {
      const [start, end] = peak.split('-').map(y => parseInt(y.trim()));
      if (currentYear >= start && currentYear <= end) return 'peak';
      if (currentYear < start) return 'aging';
      if (currentYear > end) return 'past';
    }
    return 'unknown';
  };

  const getStockStatus = (wine) => {
    if (wine.current_stock <= 0) return 'out';
    if (wine.current_stock < wine.min_stock_alert) return 'critical';
    if (wine.current_stock < wine.min_stock_alert * 1.5) return 'low';
    return 'ok';
  };

  // Extract unique regions
  const regions = useMemo(() => {
    return [...new Set(wines.map(w => w.details?.region).filter(Boolean))].sort();
  }, [wines]);

  // Filter wines
  const filteredWines = useMemo(() => {
    return wines.filter(wine => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = wine.name.toLowerCase().includes(query);
        const matchRegion = wine.details?.region?.toLowerCase().includes(query);
        const matchAppellation = wine.details?.appellation?.toLowerCase().includes(query);
        const matchGrape = Array.isArray(wine.details?.grape)
          ? wine.details.grape.some(g => g.toLowerCase().includes(query))
          : wine.details?.grape?.toLowerCase().includes(query);
        if (!matchName && !matchRegion && !matchAppellation && !matchGrape) return false;
      }

      if (filters.region !== 'all' && wine.details?.region !== filters.region) return false;

      if (filters.peakStatus !== 'all') {
        const status = getPeakStatus(wine);
        if (filters.peakStatus === 'ready' && status !== 'ready' && status !== 'peak') return false;
        if (filters.peakStatus === 'aging' && status !== 'aging') return false;
      }

      if (filters.stockStatus !== 'all') {
        const status = getStockStatus(wine);
        if (filters.stockStatus === 'critical' && status !== 'critical' && status !== 'out') return false;
      }

      return true;
    });
  }, [wines, searchQuery, filters]);

  // Stats
  const stats = useMemo(() => ({
    total: wines.length,
    totalBottles: wines.reduce((sum, w) => sum + (w.current_stock || 0), 0),
    readyToServe: wines.filter(w => ['ready', 'peak'].includes(getPeakStatus(w))).length,
    lowStock: wines.filter(w => ['critical', 'out'].includes(getStockStatus(w))).length,
  }), [wines]);

  const clearFilters = () => {
    setFilters({ region: 'all', peakStatus: 'all', stockStatus: 'all' });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.region !== 'all' || filters.peakStatus !== 'all' || filters.stockStatus !== 'all' || searchQuery;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wine}
          label="Références"
          value={stats.total}
          color="rose"
        />
        <StatCard
          icon={Package}
          label="Bouteilles"
          value={stats.totalBottles}
          color="purple"
        />
        <StatCard
          icon={Sparkles}
          label="En apogée"
          value={stats.readyToServe}
          color="amber"
          highlight
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock bas"
          value={stats.lowStock}
          color="red"
          alert={stats.lowStock > 0}
        />
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un vin, cépage, région..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-5 h-14 rounded-xl font-medium transition-all
              ${showFilters
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }
            `}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:block">Filtres</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Refresh */}
          <button
            onClick={loadWines}
            disabled={loading}
            className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Filtres</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Region */}
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  Région
                </label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500/50 transition-all cursor-pointer"
                >
                  <option value="all">Toutes les régions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Peak Status */}
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <Clock className="w-4 h-4" />
                  Maturité
                </label>
                <select
                  value={filters.peakStatus}
                  onChange={(e) => setFilters(f => ({ ...f, peakStatus: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500/50 transition-all cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="ready">Prêts à servir</option>
                  <option value="aging">En vieillissement</option>
                </select>
              </div>

              {/* Stock Status */}
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <Package className="w-4 h-4" />
                  Stock
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters(f => ({ ...f, stockStatus: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500/50 transition-all cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="critical">Stock critique</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{filteredWines.length} vin{filteredWines.length > 1 ? 's' : ''} trouvé{filteredWines.length > 1 ? 's' : ''}</span>
          <span className="text-slate-600">sur {stats.total}</span>
        </div>
      )}

      {/* Wine Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredWines.length > 0 ? (
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
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Wine className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-400 mb-2">Aucun vin trouvé</h3>
          <p className="text-sm text-slate-500 mb-4">Modifiez vos critères de recherche</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-rose-400 hover:text-rose-300 text-sm font-medium"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Wine Detail Modal */}
      {selectedWine && (
        <WineDetailModal
          wine={selectedWine}
          peakStatus={getPeakStatus(selectedWine)}
          stockStatus={getStockStatus(selectedWine)}
          onClose={() => setSelectedWine(null)}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, highlight, alert }) {
  const colorClasses = {
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-5`}>
      {highlight && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl" />
      )}
      {alert && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      <Icon className="w-6 h-6 mb-3 opacity-70" />
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function WineCard({ wine, peakStatus, stockStatus, onClick }) {
  const details = wine.details || {};

  const peakConfig = {
    ready: { badge: 'Prêt', color: 'bg-emerald-500 text-white' },
    peak: { badge: 'Apogée', color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' },
    aging: { badge: 'Garde', color: 'bg-slate-600 text-slate-300' },
    past: { badge: 'Déclin', color: 'bg-red-500/50 text-red-200' },
    unknown: { badge: null, color: '' },
  };

  const peak = peakConfig[peakStatus] || peakConfig.unknown;

  const stockColors = {
    out: 'text-red-400',
    critical: 'text-red-400',
    low: 'text-amber-400',
    ok: 'text-slate-400',
  };

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden bg-gradient-to-br from-rose-900/20 via-slate-900 to-slate-900 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-5 text-left transition-all hover:shadow-xl hover:shadow-rose-500/10 active:scale-[0.98]"
    >
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <Wine className="w-5 h-5 text-rose-400" />
          </div>
          {details.vintage && (
            <span className="text-xl font-bold text-white">{details.vintage}</span>
          )}
        </div>
        {peak.badge && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${peak.color} ${peakStatus === 'peak' ? 'animate-pulse shadow-lg shadow-amber-500/30' : ''}`}>
            {peakStatus === 'peak' && <Sparkles className="w-3 h-3 inline mr-1" />}
            {peak.badge}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-rose-200 transition-colors min-h-[3rem]">
        {wine.name}
      </h3>

      {/* Appellation */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-2">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{details.appellation || details.region || 'Non spécifié'}</span>
      </div>

      {/* Grape */}
      {details.grape && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <Grape className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {Array.isArray(details.grape) ? details.grape.join(', ') : details.grape}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${stockColors[stockStatus]}`}>
          <Package className="w-4 h-4" />
          <span>{wine.current_stock} btl</span>
        </div>

        {details.score_parker && (
          <div className="flex items-center gap-1 text-sm text-amber-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold">{details.score_parker}</span>
          </div>
        )}
      </div>

      {/* Location */}
      {wine.storage_area && (
        <p className="text-xs text-slate-600 mt-3 truncate">
          {wine.storage_area}
        </p>
      )}
    </button>
  );
}

function WineDetailModal({ wine, peakStatus, stockStatus, onClose }) {
  const details = wine.details || {};

  const peakConfig = {
    ready: { badge: 'Prêt à servir', color: 'bg-emerald-500' },
    peak: { badge: 'En Apogée', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
    aging: { badge: 'En Garde', color: 'bg-slate-600' },
    past: { badge: 'Passé', color: 'bg-red-500/50' },
    unknown: { badge: null, color: '' },
  };

  const peak = peakConfig[peakStatus] || peakConfig.unknown;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-rose-900/20 border border-rose-500/30 rounded-3xl p-8 z-50 max-h-[90vh] overflow-y-auto shadow-2xl shadow-rose-500/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              {details.vintage && (
                <span className="text-3xl font-bold text-white">{details.vintage}</span>
              )}
              {peak.badge && (
                <span className={`text-xs px-3 py-1 rounded-full font-bold text-white ${peak.color} ${peakStatus === 'peak' ? 'animate-pulse' : ''}`}>
                  {peakStatus === 'peak' && <Sparkles className="w-3 h-3 inline mr-1" />}
                  {peak.badge}
                </span>
              )}
            </div>
            {details.appellation && (
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {details.appellation}
              </p>
            )}
          </div>
        </div>

        {/* Wine Name */}
        <h2 className="text-2xl font-bold text-white mb-6">{wine.name}</h2>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {details.grape && (
            <DetailCard icon={Grape} label="Cépages">
              {Array.isArray(details.grape) ? details.grape.join(', ') : details.grape}
            </DetailCard>
          )}

          {details.peak_drink && (
            <DetailCard icon={Clock} label="Fenêtre optimale">
              {details.peak_drink}
            </DetailCard>
          )}

          {details.serving_temp && (
            <DetailCard icon={Thermometer} label="Température">
              {details.serving_temp}
            </DetailCard>
          )}

          {details.score_parker && (
            <DetailCard icon={Award} label="Note Parker" highlight>
              <span className="text-2xl font-bold text-amber-400">{details.score_parker}</span>
            </DetailCard>
          )}
        </div>

        {/* Decanting Recommendation */}
        {details.decant_time && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Carafage recommandé</p>
                <p className="text-white font-medium">{details.decant_time}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stock & Location */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <div>
            <p className="text-sm text-slate-400 mb-1">En cave</p>
            <p className="text-3xl font-bold text-white">{wine.current_stock}</p>
            <p className="text-sm text-slate-500">bouteilles</p>
          </div>
          {wine.storage_area && (
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-1">Emplacement</p>
              <p className="text-lg font-medium text-white">{wine.storage_area}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DetailCard({ icon: Icon, label, children, highlight }) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50'}`}>
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-white font-medium">{children}</div>
    </div>
  );
}
