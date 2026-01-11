/**
 * RestaurantReservations.jsx - Gestion des réservations restaurant
 *
 * Fonctionnalités:
 * - Liste des réservations du jour / semaine
 * - Création de nouvelles réservations
 * - Lien avec le CRM (customers)
 * - Attribution de table
 * - Gestion des VIP et allergies
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Phone,
  Mail,
  Crown,
  AlertTriangle,
  UtensilsCrossed,
  User,
  RefreshCw,
  Edit3,
  Trash2,
  MapPin,
} from 'lucide-react';

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const formatTime = (time) => {
  return time.slice(0, 5); // HH:MM
};

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return { bg: 'rgba(45, 90, 74, 0.2)', text: '#6db89e', label: 'Confirmée' };
    case 'pending':
      return { bg: 'rgba(201, 169, 98, 0.2)', text: '#c9a962', label: 'En attente' };
    case 'seated':
      return { bg: 'rgba(30, 58, 95, 0.2)', text: '#7fa8c9', label: 'À table' };
    case 'completed':
      return { bg: 'rgba(139, 61, 70, 0.15)', text: '#cd8b94', label: 'Terminée' };
    case 'cancelled':
      return { bg: 'rgba(155, 35, 53, 0.2)', text: '#e07a8a', label: 'Annulée' };
    case 'no_show':
      return { bg: 'rgba(155, 35, 53, 0.3)', text: '#e07a8a', label: 'No-show' };
    default:
      return { bg: 'rgba(201, 169, 98, 0.2)', text: '#c9a962', label: status };
  }
};

// ============================================================================
// COMPOSANTS
// ============================================================================

/**
 * Badge de statut
 */
function StatusBadge({ status }) {
  const { bg, text, label } = getStatusColor(status);
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
      style={{ backgroundColor: bg, color: text }}
    >
      {status === 'confirmed' && <Check className="w-3 h-3" />}
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'seated' && <UtensilsCrossed className="w-3 h-3" />}
      {label}
    </span>
  );
}

/**
 * Carte de réservation
 */
function ReservationCard({ reservation, onEdit, onCancel, onSeat }) {
  const customer = reservation.customer;
  const isVIP = customer?.is_vip;
  const hasAllergies = customer?.allergies && customer.allergies.length > 0;
  const isPast = new Date(`${reservation.date}T${reservation.time}`) < new Date();
  const isToday = reservation.date === new Date().toISOString().split('T')[0];

  return (
    <div
      className={`card hover:border-gold/30 transition-all duration-300 ${
        isPast && reservation.status !== 'seated' ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-resto/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-resto" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-ivory">
                {formatTime(reservation.time)}
              </span>
              {isVIP && (
                <span className="badge-vip">
                  <Crown className="w-3 h-3" />
                  VIP
                </span>
              )}
            </div>
            <p className="text-sm text-ivory-muted">
              {isToday ? "Aujourd'hui" : formatDate(reservation.date)}
            </p>
          </div>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      {/* Client info */}
      <div className="mb-4 p-3 bg-palace-charcoal/50 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-gold" />
          <span className="font-semibold text-ivory">
            {customer?.first_name} {customer?.last_name}
          </span>
        </div>
        {customer?.phone && (
          <div className="flex items-center gap-2 text-sm text-ivory-muted">
            <Phone className="w-3 h-3" />
            {customer.phone}
          </div>
        )}
        {customer?.email && (
          <div className="flex items-center gap-2 text-sm text-ivory-muted mt-1">
            <Mail className="w-3 h-3" />
            {customer.email}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-ivory-muted">
          <Users className="w-4 h-4" />
          <span>{reservation.guests} pers.</span>
        </div>
        {reservation.table_id && (
          <div className="flex items-center gap-1 text-ivory-muted">
            <MapPin className="w-4 h-4" />
            <span>Table {reservation.table_number || reservation.table_id}</span>
          </div>
        )}
      </div>

      {/* Allergies warning */}
      {hasAllergies && (
        <div className="mb-4 p-2 bg-ruby/10 border border-ruby/30 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-ruby mt-0.5" />
          <div>
            <p className="text-xs font-medium text-ruby">Allergies</p>
            <p className="text-xs text-ivory-muted">
              {customer.allergies.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {reservation.notes && (
        <p className="text-sm text-ivory-muted italic mb-4">
          "{reservation.notes}"
        </p>
      )}

      {/* Actions */}
      {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
        <div className="flex gap-2">
          {reservation.status === 'confirmed' && !isPast && (
            <button
              onClick={() => onSeat(reservation)}
              className="flex-1 btn-primary text-sm h-10"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Installer
            </button>
          )}
          <button
            onClick={() => onEdit(reservation)}
            className="btn-ghost text-sm h-10 px-3"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCancel(reservation)}
            className="btn-ghost text-sm h-10 px-3 text-ruby hover:bg-ruby/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Modal de création/édition de réservation
 */
function ReservationModal({ reservation, customers, tables, onClose, onSave }) {
  const isEdit = !!reservation?.id;
  const [loading, setLoading] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [form, setForm] = useState({
    customer_id: reservation?.customer_id || '',
    date: reservation?.date || new Date().toISOString().split('T')[0],
    time: reservation?.time || '19:00',
    guests: reservation?.guests || 2,
    table_id: reservation?.table_id || '',
    notes: reservation?.notes || '',
    status: reservation?.status || 'confirmed',
  });

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);

  const filteredCustomers = customers.filter((c) => {
    const q = searchCustomer.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) {
      alert('Veuillez sélectionner un client');
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ivory">
            {isEdit ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </h2>
          <button onClick={onClose} className="btn-ghost h-10 w-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer selection */}
          <div className="relative">
            <label className="block text-sm text-ivory-muted mb-2">Client *</label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-palace-charcoal/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  <span className="text-ivory">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </span>
                  {selectedCustomer.is_vip && (
                    <span className="badge-vip text-xs">VIP</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customer_id: '' })}
                  className="text-ivory-muted hover:text-ivory"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory-muted" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={searchCustomer}
                  onChange={(e) => {
                    setSearchCustomer(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="input-palace pl-10"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-palace-navy border border-palace-charcoal rounded-xl shadow-xl max-h-48 overflow-y-auto z-10">
                    {filteredCustomers.slice(0, 10).map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, customer_id: customer.id });
                          setSearchCustomer('');
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-palace-charcoal flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-ivory-muted" />
                        <span className="text-ivory">
                          {customer.first_name} {customer.last_name}
                        </span>
                        {customer.is_vip && (
                          <Crown className="w-3 h-3 text-gold ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-palace"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Heure *</label>
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input-palace"
                required
              >
                {Array.from({ length: 13 }, (_, i) => {
                  const hour = 12 + i;
                  return (
                    <>
                      <option key={`${hour}:00`} value={`${hour}:00`}>
                        {hour}:00
                      </option>
                      <option key={`${hour}:30`} value={`${hour}:30`}>
                        {hour}:30
                      </option>
                    </>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Guests & Table */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Couverts *</label>
              <select
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) })}
                className="input-palace"
                required
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'personne' : 'personnes'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Table</label>
              <select
                value={form.table_id}
                onChange={(e) => setForm({ ...form, table_id: e.target.value })}
                className="input-palace"
              >
                <option value="">À attribuer</option>
                {tables
                  .filter((t) => t.capacity >= form.guests)
                  .map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.number} ({table.capacity} places)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Status (edit mode) */}
          {isEdit && (
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-palace"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="seated">À table</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
                <option value="no_show">No-show</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-ivory-muted mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Demandes spéciales, occasion..."
              className="input-palace h-24 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold">
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {isEdit ? 'Modifier' : 'Réserver'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function RestaurantReservations() {
  // State
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // day, week
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reservationsRes, customersRes, tablesRes] = await Promise.all([
        supabase
          .from('restaurant_reservations')
          .select('*, customer:customers(*)')
          .order('date', { ascending: true })
          .order('time', { ascending: true }),
        supabase.from('customers').select('*').order('last_name'),
        supabase.from('tables').select('*').order('number'),
      ]);

      if (reservationsRes.data) setReservations(reservationsRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (tablesRes.data) setTables(tablesRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleSaveReservation = async (formData) => {
    if (editingReservation?.id) {
      // Update
      const { error } = await supabase
        .from('restaurant_reservations')
        .update(formData)
        .eq('id', editingReservation.id);
      if (error) throw error;
    } else {
      // Create
      const { error } = await supabase
        .from('restaurant_reservations')
        .insert(formData);
      if (error) throw error;
    }
    await loadData();
  };

  const handleCancelReservation = async (reservation) => {
    if (!confirm('Annuler cette réservation ?')) return;

    const { error } = await supabase
      .from('restaurant_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservation.id);

    if (!error) await loadData();
  };

  const handleSeatReservation = async (reservation) => {
    const { error } = await supabase
      .from('restaurant_reservations')
      .update({ status: 'seated' })
      .eq('id', reservation.id);

    if (!error) await loadData();
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setShowModal(true);
  };

  const handleNewReservation = () => {
    setEditingReservation(null);
    setShowModal(true);
  };

  // ============================================================================
  // DATE NAVIGATION
  // ============================================================================

  const goToDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredReservations = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (viewMode === 'day') {
      return reservations.filter((r) => r.date === dateStr);
    }

    // Week view: show 7 days starting from selectedDate
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 7);
    const endStr = endDate.toISOString().split('T')[0];

    return reservations.filter((r) => r.date >= dateStr && r.date < endStr);
  }, [reservations, selectedDate, viewMode]);

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter((r) => r.date === today);

    return {
      total: todayReservations.length,
      confirmed: todayReservations.filter((r) => r.status === 'confirmed').length,
      seated: todayReservations.filter((r) => r.status === 'seated').length,
      totalGuests: todayReservations
        .filter((r) => r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.guests, 0),
    };
  }, [reservations]);

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
          <h2 className="text-xl font-bold text-ivory flex items-center gap-2">
            <Calendar className="w-6 h-6 text-resto" />
            Réservations
          </h2>
          <p className="text-ivory-muted mt-1">
            {todayStats.total} réservations aujourd'hui ({todayStats.totalGuests} couverts)
          </p>
        </div>
        <button onClick={handleNewReservation} className="btn-gold">
          <Plus className="w-5 h-5" />
          Nouvelle réservation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-value">{todayStats.total}</div>
          <div className="kpi-label">Réservations</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{todayStats.confirmed}</div>
          <div className="kpi-label">Confirmées</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{todayStats.seated}</div>
          <div className="kpi-label">À table</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{todayStats.totalGuests}</div>
          <div className="kpi-label">Couverts</div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToDate(-1)}
              className="btn-ghost h-10 w-10 p-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToToday} className="btn-outline-gold h-10 px-4">
              Aujourd'hui
            </button>
            <button
              onClick={() => goToDate(1)}
              className="btn-ghost h-10 w-10 p-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="ml-4 text-lg font-semibold text-ivory">
              {formatDate(selectedDate)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === 'day'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'text-ivory-muted hover:text-ivory hover:bg-palace-charcoal'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'text-ivory-muted hover:text-ivory hover:bg-palace-charcoal'
              }`}
            >
              Semaine
            </button>
          </div>
        </div>

        {/* Reservations Grid */}
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-ivory-muted">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Aucune réservation</p>
            <p className="text-sm mt-1">pour cette période</p>
            <button
              onClick={handleNewReservation}
              className="btn-outline-gold mt-4"
            >
              <Plus className="w-5 h-5" />
              Ajouter une réservation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onEdit={handleEditReservation}
                onCancel={handleCancelReservation}
                onSeat={handleSeatReservation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ReservationModal
          reservation={editingReservation}
          customers={customers}
          tables={tables}
          onClose={() => {
            setShowModal(false);
            setEditingReservation(null);
          }}
          onSave={handleSaveReservation}
        />
      )}
    </div>
  );
}
