/**
 * OrderDrawer - Panneau latéral de commande premium
 *
 * Fonctionnalités clés :
 * - Affichage VIP et allergies ultra-visible
 * - SÉCURITÉ ALLERGIES : Check temps réel via JSONB
 * - Interface touch-first avec feedback visuel
 * - Gestion des statuts de commande
 */

import { useState, useEffect, useMemo } from 'react';
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
  Receipt,
  Users,
  Timer,
  Sparkles,
  CreditCard,
  Send,
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
  const [sending, setSending] = useState(false);

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

  const checkAllergens = (item) => {
    if (customerAllergies.length === 0) return [];
    const itemAllergens = item.allergens || [];
    return customerAllergies.filter(allergy =>
      itemAllergens.some(a =>
        a.toLowerCase().includes(allergy.toLowerCase()) ||
        allergy.toLowerCase().includes(a.toLowerCase())
      )
    );
  };

  const addToOrder = async (item, isWine = false) => {
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

        await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', table.id);
      }

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
      onOrderUpdate?.();
      loadData();
    } catch (err) {
      console.error('Add to order error:', err);
    }
  };

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

  // Calculate totals
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
  }, [orderItems]);

  const pendingCount = orderItems.filter(i => i.status === 'pending').length;

  // Group menu by category
  const menuByCategory = useMemo(() => {
    const grouped = {
      starter: { name: 'Entrées', icon: '🥗', items: [] },
      main: { name: 'Plats', icon: '🍽️', items: [] },
      dessert: { name: 'Desserts', icon: '🍰', items: [] },
    };
    menuItems.forEach(item => {
      const cat = item.category || 'main';
      if (grouped[cat]) grouped[cat].items.push(item);
    });
    return grouped;
  }, [menuItems]);

  // Send to kitchen
  const sendToKitchen = async () => {
    setSending(true);
    try {
      const pendingItems = orderItems.filter(i => i.status === 'pending');
      await Promise.all(pendingItems.map(item =>
        supabase.from('order_items').update({ status: 'preparing' }).eq('id', item.id)
      ));
      loadData();
    } catch (err) {
      console.error('Send to kitchen error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                {table.name}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Table {table.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{table.capacity} couverts</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/50 p-4">
              {customer.is_vip && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
              )}
              <div className="flex items-start gap-3 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  ${customer.is_vip
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-600'
                  }`}
                >
                  {customer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{customer.full_name}</span>
                    {customer.is_vip && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                        <Crown className="w-3 h-3" />
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{customer.total_visits} visites</p>
                </div>
              </div>

              {/* ALLERGIES WARNING */}
              {customerAllergies.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Allergies déclarées</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customerAllergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium rounded-full"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/95 border-b border-slate-800">
          {[
            { id: 'menu', label: 'Menu', icon: UtensilsCrossed, color: 'orange' },
            { id: 'wines', label: 'Vins', icon: Wine, color: 'rose' },
            { id: 'order', label: 'Ticket', icon: Receipt, color: 'emerald', badge: orderItems.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium
                transition-all relative
                ${activeTab === tab.id
                  ? `text-${tab.color}-400 border-b-2 border-${tab.color}-400`
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`absolute top-2 right-1/4 w-5 h-5 rounded-full bg-${tab.color}-500 text-white text-xs flex items-center justify-center font-bold`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Chargement...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Menu Tab */}
              {activeTab === 'menu' && (
                <div className="p-4 space-y-6">
                  {Object.entries(menuByCategory).map(([key, category]) => (
                    category.items.length > 0 && (
                      <section key={key}>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          <span>{category.icon}</span>
                          {category.name}
                          <span className="text-slate-600">({category.items.length})</span>
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
                      </section>
                    )
                  ))}
                </div>
              )}

              {/* Wines Tab */}
              {activeTab === 'wines' && (
                <div className="p-4 space-y-2">
                  {wines.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Wine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun vin disponible</p>
                    </div>
                  ) : (
                    wines.map(wine => (
                      <WineItem
                        key={wine.id}
                        wine={wine}
                        onAdd={() => addToOrder(wine, true)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Order Tab */}
              {activeTab === 'order' && (
                <div className="p-4">
                  {orderItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-400 mb-2">Ticket vide</h3>
                      <p className="text-sm text-slate-500">Ajoutez des articles depuis le menu</p>
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
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Total */}
        {orderItems.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
            {/* Totals */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{orderItems.length} articles</p>
                <p className="text-2xl font-bold text-white">
                  {orderTotal.toLocaleString('fr-FR')} <span className="text-lg text-slate-400">€</span>
                </p>
              </div>
              {pendingCount > 0 && (
                <button
                  onClick={sendToKitchen}
                  disabled={sending}
                  className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  Envoyer ({pendingCount})
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all">
                <CreditCard className="w-5 h-5" />
                Encaisser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Allergy Warning Modal */}
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

function MenuItem({ item, allergyConflicts, onAdd }) {
  const hasConflict = allergyConflicts.length > 0;

  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl transition-all active:scale-[0.98]
      ${hasConflict
        ? 'bg-red-500/10 border-2 border-red-500/30'
        : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50'
      }
    `}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{item.name}</span>
          {hasConflict && (
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
          )}
        </div>
        {item.description && (
          <p className="text-sm text-slate-500 truncate mt-0.5">{item.description}</p>
        )}
        {hasConflict && (
          <p className="text-xs text-red-400 mt-1 font-medium">
            Allergène: {allergyConflicts.join(', ')}
          </p>
        )}
      </div>
      <span className="text-lg font-semibold text-white whitespace-nowrap">{item.sales_price}€</span>
      <button
        onClick={onAdd}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90
          ${hasConflict
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
          }
        `}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function WineItem({ wine, onAdd }) {
  const price = Math.round(wine.purchase_price * 2.5);
  const details = wine.details || {};

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 transition-all active:scale-[0.98]">
      <div className="w-12 h-12 rounded-xl bg-rose-900/30 flex items-center justify-center flex-shrink-0">
        <Wine className="w-6 h-6 text-rose-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-white block truncate">{wine.name}</span>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
          <span>{details.vintage || 'NV'}</span>
          <span>•</span>
          <span>{wine.current_stock} btl</span>
        </div>
      </div>
      <span className="text-lg font-semibold text-white whitespace-nowrap">{price}€</span>
      <button
        onClick={onAdd}
        className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 flex items-center justify-center transition-all active:scale-90"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function OrderItem({ item, onStatusChange }) {
  const name = item.menu_item?.name || item.product?.name || 'Item';
  const isWine = !!item.product_id;

  const statusConfig = {
    pending: { icon: Clock, color: 'slate', bg: 'bg-slate-700', label: 'En attente' },
    preparing: { icon: ChefHat, color: 'amber', bg: 'bg-amber-500/20', label: 'En cuisine' },
    ready: { icon: Sparkles, color: 'emerald', bg: 'bg-emerald-500/20', label: 'Prêt!' },
    served: { icon: Check, color: 'slate', bg: 'bg-slate-800', label: 'Servi' },
  };

  const status = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const nextStatus = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'served',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${status.bg} transition-all`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isWine ? 'bg-rose-500/20' : 'bg-orange-500/20'
      }`}>
        {isWine ? (
          <Wine className="w-5 h-5 text-rose-400" />
        ) : (
          <StatusIcon className={`w-5 h-5 text-${status.color}-400`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-white block truncate">{name}</span>
        <span className="text-sm text-slate-500">
          {item.quantity}x {item.unit_price}€
        </span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full text-${status.color}-400 bg-${status.color}-500/10`}>
        {status.label}
      </span>
      {nextStatus[item.status] && (
        <button
          onClick={() => onStatusChange(item.id, nextStatus[item.status])}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <Check className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function AllergyWarningModal({ item, conflicts, customerName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border-2 border-red-500 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/20">
        {/* Pulsing background */}
        <div className="absolute inset-0 bg-red-500/5 rounded-2xl animate-pulse" />

        <div className="relative text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/30">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>

          <h3 className="text-2xl font-bold text-red-500 mb-4">
            ALERTE ALLERGIE
          </h3>

          <p className="text-white mb-6">
            <strong className="text-lg">{item.name}</strong><br />
            <span className="text-slate-400">contient des allergènes dangereux pour</span><br />
            <strong className="text-orange-400">{customerName}</strong>
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {conflicts.map((allergy, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse"
              >
                <AlertTriangle className="w-4 h-4" />
                {allergy}
              </span>
            ))}
          </div>

          <p className="text-sm text-slate-500 mb-8">
            Cette action peut mettre en danger la santé du client.<br />
            Êtes-vous absolument certain ?
          </p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
