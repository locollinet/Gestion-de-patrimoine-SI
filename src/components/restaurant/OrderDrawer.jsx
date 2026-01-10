/**
 * OrderDrawer - Panneau latéral de commande
 *
 * Fonctionnalités clés :
 * - Affichage des infos client (VIP, allergies)
 * - SÉCURITÉ ALLERGIES : Check temps réel via JSONB
 * - Ajout de plats avec alerte si allergène détecté
 * - Liste des items commandés avec statuts
 */

import { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../utils/supabaseClient';
import {
  X,
  Crown,
  AlertTriangle,
  Plus,
  Minus,
  Check,
  Clock,
  ChefHat,
  UtensilsCrossed,
  Wine,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export default function OrderDrawer({ table, order, onClose, onOrderUpdate }) {
  const { businessId } = useBusiness();
  const [menuItems, setMenuItems] = useState([]);
  const [wines, setWines] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [customer, setCustomer] = useState(order?.customer || null);
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(true);
  const [allergyWarning, setAllergyWarning] = useState(null);

  // Allergies du client
  const customerAllergies = customer?.preferences?.allergies || [];

  useEffect(() => {
    loadData();
  }, [businessId, order]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuRes, winesRes, itemsRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', businessId)
          .eq('is_available', true)
          .order('category'),
        supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .eq('category', 'wine')
          .gt('current_stock', 0)
          .order('name'),
        order?.id
          ? supabase
              .from('order_items')
              .select('*, menu_item:menu_items(*), product:products(*)')
              .eq('order_id', order.id)
          : Promise.resolve({ data: [] }),
      ]);

      setMenuItems(menuRes.data || []);
      setWines(winesRes.data || []);
      setOrderItems(itemsRes.data || []);
    } catch (err) {
      console.error('OrderDrawer load error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * SÉCURITÉ ALLERGIES : Vérifie si un plat contient des allergènes du client
   */
  const checkAllergens = (item) => {
    if (customerAllergies.length === 0) return [];

    // Allergènes du plat (depuis le champ allergens JSON)
    const itemAllergens = item.allergens || [];

    // Trouver les allergènes en commun
    const conflicts = customerAllergies.filter(allergy =>
      itemAllergens.some(a =>
        a.toLowerCase().includes(allergy.toLowerCase()) ||
        allergy.toLowerCase().includes(a.toLowerCase())
      )
    );

    return conflicts;
  };

  /**
   * Ajouter un item à la commande avec vérification allergies
   */
  const addToOrder = async (item, isWine = false) => {
    // Check allergies
    if (!isWine) {
      const conflicts = checkAllergens(item);
      if (conflicts.length > 0) {
        setAllergyWarning({
          item,
          conflicts,
          onConfirm: () => {
            performAddToOrder(item, isWine);
            setAllergyWarning(null);
          },
        });
        return;
      }
    }

    await performAddToOrder(item, isWine);
  };

  const performAddToOrder = async (item, isWine) => {
    try {
      // Si pas de commande, en créer une
      let currentOrderId = order?.id;

      if (!currentOrderId) {
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            business_id: businessId,
            table_id: table.id,
            customer_id: customer?.id || null,
            status: 'open',
          })
          .select()
          .single();

        if (orderError) throw orderError;
        currentOrderId = newOrder.id;

        // Mettre à jour le status de la table
        await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', table.id);
      }

      // Ajouter l'item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: currentOrderId,
          menu_item_id: isWine ? null : item.id,
          product_id: isWine ? item.id : null,
          quantity: 1,
          unit_price: isWine ? (item.purchase_price * 2.5) : item.sales_price,
          status: 'pending',
        });

      if (itemError) throw itemError;

      // Refresh
      onOrderUpdate?.();
      loadData();
    } catch (err) {
      console.error('Add to order error:', err);
    }
  };

  /**
   * Mettre à jour le statut d'un item
   */
  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await supabase
        .from('order_items')
        .update({ status: newStatus })
        .eq('id', itemId);

      loadData();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Grouper les items du menu par catégorie
  const menuByCategory = {
    starter: { name: 'Entrées', items: [] },
    main: { name: 'Plats', items: [] },
    dessert: { name: 'Desserts', items: [] },
  };

  menuItems.forEach(item => {
    const cat = item.category || 'main';
    if (menuByCategory[cat]) {
      menuByCategory[cat].items.push(item);
    }
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">{table.name}</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info client */}
          {customer && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                ${customer.is_vip ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-slate-600'}`}>
                {customer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">
                    {customer.full_name}
                  </span>
                  {customer.is_vip && (
                    <span className="badge-vip text-[10px]">
                      <Crown className="w-2.5 h-2.5" />
                      VIP
                    </span>
                  )}
                </div>

                {/* ALLERGIES - TRÈS VISIBLE */}
                {customerAllergies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {customerAllergies.map((allergy, i) => (
                      <span key={i} className="badge-allergy">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {allergy}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${activeTab === 'menu'
                ? 'text-resto border-b-2 border-resto'
                : 'text-slate-400 hover:text-white'}`}
          >
            <UtensilsCrossed className="w-4 h-4 inline mr-2" />
            Menu
          </button>
          <button
            onClick={() => setActiveTab('wines')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${activeTab === 'wines'
                ? 'text-sommelier border-b-2 border-sommelier'
                : 'text-slate-400 hover:text-white'}`}
          >
            <Wine className="w-4 h-4 inline mr-2" />
            Vins
          </button>
          <button
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'order'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-400 hover:text-white'}`}
          >
            Commande
            {orderItems.length > 0 && (
              <span className="absolute top-2 right-4 w-5 h-5 rounded-full bg-resto text-white text-xs flex items-center justify-center">
                {orderItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Tab Menu */}
              {activeTab === 'menu' && (
                <div className="p-4 space-y-6">
                  {Object.entries(menuByCategory).map(([key, category]) => (
                    category.items.length > 0 && (
                      <div key={key}>
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                          {category.name}
                        </h3>
                        <div className="space-y-2">
                          {category.items.map(item => (
                            <MenuItem
                              key={item.id}
                              item={item}
                              allergyConflicts={checkAllergens(item)}
                              onAdd={() => addToOrder(item, false)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Tab Vins */}
              {activeTab === 'wines' && (
                <div className="p-4 space-y-2">
                  {wines.map(wine => (
                    <WineItem
                      key={wine.id}
                      wine={wine}
                      onAdd={() => addToOrder(wine, true)}
                    />
                  ))}
                </div>
              )}

              {/* Tab Commande */}
              {activeTab === 'order' && (
                <div className="p-4">
                  {orderItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun article dans la commande</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map(item => (
                        <OrderItem
                          key={item.id}
                          item={item}
                          onStatusChange={updateItemStatus}
                        />
                      ))}

                      {/* Total */}
                      <div className="mt-6 pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span className="text-slate-300">Total</span>
                          <span className="text-white">
                            {orderItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0).toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Alerte Allergie */}
      {allergyWarning && (
        <AllergyWarningModal
          item={allergyWarning.item}
          conflicts={allergyWarning.conflicts}
          customerName={customer?.full_name}
          onConfirm={allergyWarning.onConfirm}
          onCancel={() => setAllergyWarning(null)}
        />
      )}
    </>
  );
}

/**
 * MenuItem - Item du menu avec indicateur allergène
 */
function MenuItem({ item, allergyConflicts, onAdd }) {
  const hasConflict = allergyConflicts.length > 0;

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg transition-colors
      ${hasConflict
        ? 'bg-red-600/10 border border-red-600/30'
        : 'bg-slate-800 hover:bg-slate-700'}
    `}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{item.name}</span>
          {hasConflict && (
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>
        {item.description && (
          <p className="text-sm text-slate-400 truncate">{item.description}</p>
        )}
        {hasConflict && (
          <p className="text-xs text-red-400 mt-1">
            Contient : {allergyConflicts.join(', ')}
          </p>
        )}
      </div>
      <span className="text-white font-medium">{item.sales_price} €</span>
      <button
        onClick={onAdd}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
          ${hasConflict
            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
            : 'bg-resto/20 text-resto hover:bg-resto/30'}`}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * WineItem - Item vin
 */
function WineItem({ wine, onAdd }) {
  const price = Math.round(wine.purchase_price * 2.5);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
      <Wine className="w-5 h-5 text-sommelier flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-white block truncate">{wine.name}</span>
        <span className="text-sm text-slate-400">
          {wine.details?.vintage || 'NV'} • {wine.current_stock} btl
        </span>
      </div>
      <span className="text-white font-medium">{price} €</span>
      <button
        onClick={onAdd}
        className="w-10 h-10 rounded-lg bg-sommelier/20 text-rose-300 hover:bg-sommelier/30 flex items-center justify-center transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * OrderItem - Item dans la commande avec gestion des statuts
 */
function OrderItem({ item, onStatusChange }) {
  const name = item.menu_item?.name || item.product?.name || 'Item';

  const statusConfig = {
    pending: { icon: Clock, color: 'text-slate-400', label: 'En attente' },
    preparing: { icon: ChefHat, color: 'text-amber-400', label: 'En préparation' },
    ready: { icon: Check, color: 'text-emerald-400', label: 'Prêt' },
    served: { icon: UtensilsCrossed, color: 'text-slate-500', label: 'Servi' },
  };

  const status = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const nextStatus = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'served',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800">
      <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ${status.color}`}>
        <StatusIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-white block truncate">{name}</span>
        <span className="text-sm text-slate-500">
          {item.quantity}x • {item.unit_price} €
        </span>
      </div>
      {item.notes && (
        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
          {item.notes}
        </span>
      )}
      {nextStatus[item.status] && (
        <button
          onClick={() => onStatusChange(item.id, nextStatus[item.status])}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          → {statusConfig[nextStatus[item.status]].label}
        </button>
      )}
    </div>
  );
}

/**
 * AllergyWarningModal - Modal d'alerte allergie CRITIQUE
 */
function AllergyWarningModal({ item, conflicts, customerName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative bg-slate-900 border-2 border-red-600 rounded-2xl p-6 max-w-md w-full animate-pulse">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-xl font-bold text-red-500 mb-2">
            ALERTE ALLERGIE
          </h3>

          <p className="text-white mb-4">
            <strong>{item.name}</strong> contient des allergènes
            auxquels <strong>{customerName}</strong> est allergique :
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {conflicts.map((allergy, i) => (
              <span key={i} className="badge-allergy text-sm px-3 py-1.5">
                <AlertTriangle className="w-3 h-3" />
                {allergy}
              </span>
            ))}
          </div>

          <p className="text-sm text-slate-400 mb-6">
            Êtes-vous absolument sûr de vouloir ajouter ce plat ?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="btn flex-1 bg-slate-700 text-white hover:bg-slate-600"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="btn flex-1 btn-danger"
            >
              <AlertCircle className="w-5 h-5" />
              Ajouter quand même
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
