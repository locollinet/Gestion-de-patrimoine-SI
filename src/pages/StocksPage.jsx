/**
 * StocksPage.jsx - Module Gestion des Stocks HorecaOS
 *
 * Fonctionnalités:
 * - Vue d'ensemble des stocks (ingrédients + vins)
 * - Alertes stock critique/bas
 * - Mouvements de stock liés aux commandes
 * - Ajustements manuels
 * - Historique des mouvements
 */

import { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../utils/supabaseClient';
import {
  Package,
  Wine,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Minus,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  Utensils,
  BarChart3,
} from 'lucide-react';

// ============================================================================
// COMPOSANTS
// ============================================================================

/**
 * Badge de niveau de stock
 */
function StockLevelBadge({ current, minimum, critical }) {
  if (current <= critical) {
    return (
      <span className="badge-stock-critical">
        <AlertTriangle className="w-3 h-3" />
        Critique
      </span>
    );
  }
  if (current <= minimum) {
    return (
      <span className="badge-stock-low">
        <TrendingDown className="w-3 h-3" />
        Bas
      </span>
    );
  }
  return (
    <span className="pill pill-emerald">
      <Check className="w-3 h-3" />
      OK
    </span>
  );
}

/**
 * Barre de progression du stock
 */
function StockBar({ current, minimum, critical, max }) {
  const percentage = Math.min((current / max) * 100, 100);

  let barColor = 'bg-stock';
  if (current <= critical) {
    barColor = 'bg-ruby';
  } else if (current <= minimum) {
    barColor = 'bg-gold';
  }

  return (
    <div className="w-full h-2 bg-palace-charcoal rounded-full overflow-hidden">
      <div
        className={`h-full ${barColor} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/**
 * Carte de produit en stock
 */
function StockCard({ item, type, onAdjust, onViewHistory }) {
  const isWine = type === 'wine';
  const IconComponent = isWine ? Wine : Package;
  const accentColor = isWine ? '#6b2d3c' : '#2d5a4a';

  const maxStock = item.maximum_stock || item.current_stock * 2 || 100;

  return (
    <div className="card group hover:border-gold/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <IconComponent className="w-6 h-6" style={{ color: isWine ? '#c9889a' : '#6db89e' }} />
          </div>
          <div>
            <h3 className="font-semibold text-ivory">{item.name}</h3>
            <p className="text-sm text-ivory-muted">
              {isWine ? `${item.appellation} ${item.vintage}` : item.category}
            </p>
          </div>
        </div>
        <StockLevelBadge
          current={item.current_stock}
          minimum={item.minimum_stock || 10}
          critical={item.critical_stock || 5}
        />
      </div>

      {/* Barre de stock */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ivory-muted">Stock actuel</span>
          <span className="font-bold text-ivory">
            {item.current_stock} {item.unit || 'unités'}
          </span>
        </div>
        <StockBar
          current={item.current_stock}
          minimum={item.minimum_stock || 10}
          critical={item.critical_stock || 5}
          max={maxStock}
        />
        <div className="flex justify-between text-xs text-ivory-muted mt-1">
          <span>Critique: {item.critical_stock || 5}</span>
          <span>Min: {item.minimum_stock || 10}</span>
        </div>
      </div>

      {/* Dernière mise à jour */}
      {item.last_movement && (
        <div className="text-xs text-ivory-muted mb-4 flex items-center gap-1">
          <History className="w-3 h-3" />
          Dernier mvt: {new Date(item.last_movement).toLocaleDateString('fr-FR')}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onAdjust(item, 'in')}
          className="flex-1 btn-ghost text-sm h-10 text-stock hover:bg-stock/10"
        >
          <Plus className="w-4 h-4" />
          Entrée
        </button>
        <button
          onClick={() => onAdjust(item, 'out')}
          className="flex-1 btn-ghost text-sm h-10 text-ruby hover:bg-ruby/10"
        >
          <Minus className="w-4 h-4" />
          Sortie
        </button>
        <button
          onClick={() => onViewHistory(item)}
          className="btn-ghost text-sm h-10 px-3"
          title="Historique"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Ligne de mouvement de stock
 */
function MovementRow({ movement }) {
  const isEntry = movement.movement_type === 'in' || movement.quantity > 0;
  const IconComponent = isEntry ? ArrowDownCircle : ArrowUpCircle;
  const colorClass = isEntry ? 'text-stock' : 'text-ruby';

  const reasonLabels = {
    order: 'Commande',
    adjustment: 'Ajustement',
    delivery: 'Livraison',
    waste: 'Perte',
    inventory: 'Inventaire',
    transfer: 'Transfert',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-palace-charcoal/50 last:border-0">
      <div className="flex items-center gap-3">
        <IconComponent className={`w-5 h-5 ${colorClass}`} />
        <div>
          <p className="text-sm text-ivory">
            {movement.product_name || 'Produit'}
          </p>
          <p className="text-xs text-ivory-muted">
            {reasonLabels[movement.reason] || movement.reason}
            {movement.order_id && (
              <span className="ml-2 text-gold">
                #{movement.order_id.slice(0, 8)}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${colorClass}`}>
          {isEntry ? '+' : ''}{movement.quantity} {movement.unit || 'u'}
        </p>
        <p className="text-xs text-ivory-muted">
          {new Date(movement.created_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Modal d'ajustement de stock
 */
function AdjustmentModal({ item, type, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState(type === 'in' ? 'delivery' : 'adjustment');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const isEntry = type === 'in';
  const title = isEntry ? 'Entrée de stock' : 'Sortie de stock';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adjustedQty = isEntry ? quantity : -quantity;
      await onConfirm(item, adjustedQty, reason, note);
      onClose();
    } catch (error) {
      console.error('Erreur ajustement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isEntry ? 'text-stock' : 'text-ruby'}`}>{title}</h2>
          <button onClick={onClose} className="btn-ghost h-10 w-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-palace-charcoal/50 rounded-xl">
          <p className="font-semibold text-ivory">{item.name}</p>
          <p className="text-sm text-ivory-muted">
            Stock actuel: {item.current_stock} {item.unit || 'unités'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ivory-muted mb-2">Quantité</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="input-palace"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-ivory-muted mb-2">Motif</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-palace"
            >
              {isEntry ? (
                <>
                  <option value="delivery">Livraison fournisseur</option>
                  <option value="adjustment">Ajustement inventaire</option>
                  <option value="transfer">Transfert interne</option>
                </>
              ) : (
                <>
                  <option value="adjustment">Ajustement inventaire</option>
                  <option value="waste">Perte / Casse</option>
                  <option value="transfer">Transfert interne</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm text-ivory-muted mb-2">Note (optionnel)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Commentaire..."
              className="input-palace"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 btn text-white ${isEntry ? 'bg-stock' : 'bg-ruby'}`}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isEntry ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  Confirmer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal d'historique des mouvements
 */
function HistoryModal({ item, movements, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-ivory">Historique</h2>
            <p className="text-sm text-ivory-muted">{item.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-10 w-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {movements.length === 0 ? (
            <div className="text-center py-8 text-ivory-muted">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-1">
              {movements.map((mv) => (
                <MovementRow key={mv.id} movement={mv} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * KPI Card
 */
function KPICard({ icon: Icon, label, value, colorClass = 'gold' }) {
  const colorMap = {
    gold: { bg: 'rgba(201, 169, 98, 0.2)', text: '#c9a962' },
    ruby: { bg: 'rgba(155, 35, 53, 0.2)', text: '#e07a8a' },
    stock: { bg: 'rgba(45, 90, 74, 0.2)', text: '#6db89e' },
    hotel: { bg: 'rgba(30, 58, 95, 0.2)', text: '#7fa8c9' },
  };

  const colors = colorMap[colorClass] || colorMap.gold;

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: colors.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: colors.text }} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function StocksPage() {
  const { businessId } = useBusiness();

  // State
  const [ingredients, setIngredients] = useState([]);
  const [wines, setWines] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, ingredients, wines, alerts
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, stock, alert
  const [sortAsc, setSortAsc] = useState(true);

  // Modals
  const [adjustModal, setAdjustModal] = useState(null); // { item, type: 'in'|'out' }
  const [historyModal, setHistoryModal] = useState(null);
  const [itemMovements, setItemMovements] = useState([]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (businessId) {
      loadData();
    }
  }, [businessId]);

  async function loadData() {
    setLoading(true);
    try {
      const [ingredientsRes, winesRes, movementsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .eq('category', 'food')
          .order('name'),
        supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .eq('category', 'wine')
          .order('name'),
        supabase
          .from('stock_movements')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (ingredientsRes.data) setIngredients(ingredientsRes.data);
      if (winesRes.data) setWines(winesRes.data);
      if (movementsRes.data) setMovements(movementsRes.data);
    } catch (error) {
      console.error('Erreur chargement stocks:', error);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  async function handleAdjustStock(item, quantity, reason, note) {
    const isWine = item.category === 'wine';
    const productType = isWine ? 'wine' : 'food';

    // 1. Mettre à jour le stock
    const newStock = Math.max(0, item.current_stock + quantity);
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', item.id);

    if (updateError) throw updateError;

    // 2. Enregistrer le mouvement
    const { error: movementError } = await supabase.from('stock_movements').insert({
      business_id: businessId,
      product_id: item.id,
      product_type: productType,
      product_name: item.name,
      quantity: quantity,
      movement_type: quantity > 0 ? 'in' : 'out',
      reason: reason,
      note: note,
      unit: item.unit || 'unités',
    });

    if (movementError) console.error('Erreur mouvement:', movementError);

    // 3. Recharger les données
    await loadData();
  }

  async function handleViewHistory(item) {
    const isWine = item.category === 'wine';
    const productType = isWine ? 'wine' : 'food';

    const { data } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', item.id)
      .eq('product_type', productType)
      .order('created_at', { ascending: false })
      .limit(20);

    setItemMovements(data || []);
    setHistoryModal(item);
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const allProducts = useMemo(() => {
    const ingredientItems = ingredients.map((i) => ({
      ...i,
      _type: 'ingredient',
      minimum_stock: i.min_stock_alert || 10,
      critical_stock: Math.floor((i.min_stock_alert || 10) / 2),
    }));
    const wineItems = wines.map((w) => ({
      ...w,
      _type: 'wine',
      minimum_stock: w.min_stock_alert || 6,
      critical_stock: Math.floor((w.min_stock_alert || 6) / 3),
    }));
    return [...ingredientItems, ...wineItems];
  }, [ingredients, wines]);

  const filteredProducts = useMemo(() => {
    let items = [...allProducts];

    // Filtre par onglet
    if (activeTab === 'ingredients') {
      items = items.filter((i) => i._type === 'ingredient');
    } else if (activeTab === 'wines') {
      items = items.filter((i) => i._type === 'wine');
    } else if (activeTab === 'alerts') {
      items = items.filter((i) => i.current_stock <= i.minimum_stock);
    }

    // Filtre par recherche
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.appellation && i.appellation.toLowerCase().includes(q))
      );
    }

    // Tri
    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'stock') {
        cmp = a.current_stock - b.current_stock;
      } else if (sortBy === 'alert') {
        const aAlert = a.current_stock <= a.critical_stock ? 0 : a.current_stock <= a.minimum_stock ? 1 : 2;
        const bAlert = b.current_stock <= b.critical_stock ? 0 : b.current_stock <= b.minimum_stock ? 1 : 2;
        cmp = aAlert - bAlert;
      }
      return sortAsc ? cmp : -cmp;
    });

    return items;
  }, [allProducts, activeTab, searchQuery, sortBy, sortAsc]);

  // KPIs
  const kpis = useMemo(() => {
    const critical = allProducts.filter((i) => i.current_stock <= i.critical_stock).length;
    const low = allProducts.filter(
      (i) => i.current_stock > i.critical_stock && i.current_stock <= i.minimum_stock
    ).length;
    const totalProducts = allProducts.length;
    const todayMovements = movements.filter((m) => {
      const today = new Date().toDateString();
      return new Date(m.created_at).toDateString() === today;
    }).length;

    return { critical, low, totalProducts, todayMovements };
  }, [allProducts, movements]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ivory flex items-center gap-3">
            <Package className="w-7 h-7 text-stock" />
            Gestion des Stocks
          </h1>
          <p className="text-ivory-muted mt-1">
            Suivi en temps réel de l'inventaire
          </p>
        </div>
        <button onClick={loadData} className="btn-outline-gold">
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={AlertTriangle}
          label="Stock critique"
          value={kpis.critical}
          colorClass="ruby"
        />
        <KPICard
          icon={TrendingDown}
          label="Stock bas"
          value={kpis.low}
          colorClass="gold"
        />
        <KPICard
          icon={Package}
          label="Total produits"
          value={kpis.totalProducts}
          colorClass="stock"
        />
        <KPICard
          icon={History}
          label="Mouvements aujourd'hui"
          value={kpis.todayMovements}
          colorClass="hotel"
        />
      </div>

      {/* Tabs & Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'all', label: 'Tout', icon: BarChart3 },
              { id: 'ingredients', label: 'Ingrédients', icon: Utensils },
              { id: 'wines', label: 'Vins', icon: Wine },
              { id: 'alerts', label: 'Alertes', icon: AlertTriangle, count: kpis.critical + kpis.low },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'text-ivory-muted hover:text-ivory hover:bg-palace-charcoal'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-ruby text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory-muted" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-palace pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-palace w-auto"
            >
              <option value="name">Nom</option>
              <option value="stock">Stock</option>
              <option value="alert">Alerte</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="btn-ghost h-14 w-14 p-0"
              title={sortAsc ? 'Croissant' : 'Décroissant'}
            >
              {sortAsc ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-ivory-muted mb-4">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
        </p>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-ivory-muted">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Aucun produit trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((item) => (
              <StockCard
                key={`${item._type}-${item.id}`}
                item={item}
                type={item._type}
                onAdjust={(item, type) => setAdjustModal({ item, type })}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mouvements récents */}
      <div className="card">
        <h2 className="text-lg font-bold text-ivory mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gold" />
          Mouvements récents
        </h2>

        {movements.length === 0 ? (
          <p className="text-center py-8 text-ivory-muted">
            Aucun mouvement enregistré
          </p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {movements.slice(0, 10).map((mv) => (
              <MovementRow key={mv.id} movement={mv} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {adjustModal && (
        <AdjustmentModal
          item={adjustModal.item}
          type={adjustModal.type}
          onClose={() => setAdjustModal(null)}
          onConfirm={handleAdjustStock}
        />
      )}

      {historyModal && (
        <HistoryModal
          item={historyModal}
          movements={itemMovements}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}
