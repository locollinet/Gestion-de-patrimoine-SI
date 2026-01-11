/**
 * ClientsPage.jsx - CRM HorecaOS
 *
 * CRM intégré avec vue 360° du client :
 * - Profil complet avec préférences
 * - Historique hôtel (séjours)
 * - Historique restaurant (réservations, commandes)
 * - Préférences vins
 * - Allergies et régimes
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  Crown,
  AlertTriangle,
  Search,
  Wine,
  Hotel,
  Heart,
  Plus,
  X,
  Check,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  UtensilsCrossed,
  Bed,
  Star,
  Edit3,
  ChevronRight,
  Filter,
  User,
  Euro,
  Clock,
  History,
} from 'lucide-react';

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0);
};

// ============================================================================
// COMPOSANTS
// ============================================================================

/**
 * Badge VIP
 */
function VIPBadge() {
  return (
    <span className="badge-vip">
      <Crown className="w-3 h-3" />
      VIP
    </span>
  );
}

/**
 * KPI Card
 */
function KPICard({ icon: Icon, label, value, colorClass = 'gold' }) {
  const colorMap = {
    gold: { bg: 'rgba(201, 169, 98, 0.2)', text: '#c9a962' },
    resto: { bg: 'rgba(114, 47, 55, 0.2)', text: '#cd8b94' },
    hotel: { bg: 'rgba(30, 58, 95, 0.2)', text: '#7fa8c9' },
    sommelier: { bg: 'rgba(107, 45, 60, 0.2)', text: '#c9889a' },
  };
  const colors = colorMap[colorClass] || colorMap.gold;

  return (
    <div className="kpi-card">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: colors.text }} />
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

/**
 * Carte client
 */
function CustomerCard({ customer, onClick }) {
  const allergies = customer.allergies || [];
  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-gold/30 transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              customer.is_vip
                ? 'bg-gradient-to-br from-gold to-gold-dark'
                : 'bg-palace-charcoal'
            }`}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-ivory group-hover:text-gold transition-colors">
              {customer.first_name} {customer.last_name}
            </h3>
            <p className="text-sm text-ivory-muted">
              {customer.total_visits || 0} visite{customer.total_visits !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {customer.is_vip && <VIPBadge />}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 py-3 border-y border-palace-charcoal mb-4">
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-ivory">
            {formatCurrency(customer.total_spent)}
          </div>
          <div className="text-xs text-ivory-muted">Total dépensé</div>
        </div>
        {customer.last_visit && (
          <div className="flex-1 text-center border-l border-palace-charcoal">
            <div className="text-sm font-medium text-ivory">
              {formatDate(customer.last_visit)}
            </div>
            <div className="text-xs text-ivory-muted">Dernière visite</div>
          </div>
        )}
      </div>

      {/* Allergies */}
      {allergies.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {allergies.slice(0, 3).map((allergy, i) => (
              <span key={i} className="badge-allergy text-xs">
                <AlertTriangle className="w-2.5 h-2.5" />
                {allergy}
              </span>
            ))}
            {allergies.length > 3 && (
              <span className="text-xs text-ivory-muted">+{allergies.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="space-y-1 text-sm">
        {customer.phone && (
          <div className="flex items-center gap-2 text-ivory-muted">
            <Phone className="w-3 h-3" />
            {customer.phone}
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-ivory-muted truncate">
            <Mail className="w-3 h-3" />
            {customer.email}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-gold" />
      </div>
    </div>
  );
}

/**
 * Modal profil client 360°
 */
function CustomerProfileModal({ customer, onClose, onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    is_vip: customer.is_vip || false,
    allergies: customer.allergies || [],
    preferences: customer.preferences || {},
    notes: customer.notes || '',
  });

  useEffect(() => {
    loadCustomerHistory();
  }, [customer.id]);

  async function loadCustomerHistory() {
    setLoading(true);
    try {
      const [bookingsRes, reservationsRes] = await Promise.all([
        supabase
          .from('hotel_bookings')
          .select('*, room:rooms(*)')
          .eq('customer_id', customer.id)
          .order('check_in', { ascending: false })
          .limit(10),
        supabase
          .from('restaurant_reservations')
          .select('*')
          .eq('customer_id', customer.id)
          .order('date', { ascending: false })
          .limit(10),
      ]);

      if (bookingsRes.data) setHotelBookings(bookingsRes.data);
      if (reservationsRes.data) setReservations(reservationsRes.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update(form)
        .eq('id', customer.id);

      if (!error) {
        onUpdate();
        setEditing(false);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'hotel', label: 'Hôtel', icon: Hotel, count: hotelBookings.length },
    { id: 'resto', label: 'Restaurant', icon: UtensilsCrossed, count: reservations.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ${
                customer.is_vip
                  ? 'bg-gradient-to-br from-gold to-gold-dark'
                  : 'bg-palace-charcoal'
              }`}
            >
              {customer.first_name?.[0]}{customer.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-ivory">
                  {customer.first_name} {customer.last_name}
                </h2>
                {customer.is_vip && <VIPBadge />}
              </div>
              <p className="text-ivory-muted">
                Client depuis {customer.created_at ? formatDate(customer.created_at) : 'N/A'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost h-10 w-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
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
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-palace-charcoal">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-palace-charcoal/50 rounded-xl">
                  <Euro className="w-5 h-5 mx-auto mb-2 text-gold" />
                  <div className="font-bold text-ivory">{formatCurrency(customer.total_spent)}</div>
                  <div className="text-xs text-ivory-muted">Total dépensé</div>
                </div>
                <div className="text-center p-4 bg-palace-charcoal/50 rounded-xl">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-hotel" />
                  <div className="font-bold text-ivory">{hotelBookings.length}</div>
                  <div className="text-xs text-ivory-muted">Séjours</div>
                </div>
                <div className="text-center p-4 bg-palace-charcoal/50 rounded-xl">
                  <UtensilsCrossed className="w-5 h-5 mx-auto mb-2 text-resto" />
                  <div className="font-bold text-ivory">{reservations.length}</div>
                  <div className="text-xs text-ivory-muted">Réservations</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="card-gold">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ivory">Informations</h3>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="btn-ghost h-8 px-3 text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    {editing ? 'Annuler' : 'Modifier'}
                  </button>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-ivory-muted mb-1">Prénom</label>
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                          className="input-palace h-10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-ivory-muted mb-1">Nom</label>
                        <input
                          type="text"
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                          className="input-palace h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-ivory-muted mb-1">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-palace h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-ivory-muted mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="input-palace h-10"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_vip}
                        onChange={(e) => setForm({ ...form, is_vip: e.target.checked })}
                        className="w-4 h-4 rounded border-gold/50 bg-palace-navy"
                      />
                      <span className="text-sm text-ivory">Client VIP</span>
                    </label>
                    <div>
                      <label className="block text-sm text-ivory-muted mb-1">Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="input-palace h-20 resize-none"
                      />
                    </div>
                    <button onClick={handleSave} className="btn-gold w-full" disabled={loading}>
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-ivory-muted">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-ivory-muted">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone || 'Non renseigné'}</span>
                    </div>
                    {customer.notes && (
                      <p className="text-sm text-ivory-muted italic mt-4">
                        "{customer.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Allergies */}
              {customer.allergies && customer.allergies.length > 0 && (
                <div className="p-4 bg-ruby/10 border border-ruby/30 rounded-xl">
                  <h3 className="font-semibold text-ruby mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Allergies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.allergies.map((allergy, i) => (
                      <span key={i} className="badge-allergy">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Préférences */}
              {customer.preferences && Object.keys(customer.preferences).length > 0 && (
                <div className="card-gold">
                  <h3 className="font-semibold text-ivory mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-gold" />
                    Préférences
                  </h3>
                  <div className="space-y-2">
                    {customer.preferences.wine_regions && (
                      <div className="flex items-center gap-2 text-sm text-ivory-muted">
                        <Wine className="w-4 h-4 text-sommelier" />
                        Vins: {customer.preferences.wine_regions.join(', ')}
                      </div>
                    )}
                    {customer.preferences.room_floor && (
                      <div className="flex items-center gap-2 text-sm text-ivory-muted">
                        <Hotel className="w-4 h-4 text-hotel" />
                        Étage {customer.preferences.room_floor === 'high' ? 'élevé' : 'bas'}
                        {customer.preferences.room_view && `, vue ${customer.preferences.room_view}`}
                      </div>
                    )}
                    {customer.preferences.dietary && (
                      <div className="flex items-center gap-2 text-sm text-ivory-muted">
                        <UtensilsCrossed className="w-4 h-4 text-resto" />
                        Régime: {customer.preferences.dietary}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hotel' && (
            <div className="space-y-4">
              {hotelBookings.length === 0 ? (
                <div className="text-center py-12 text-ivory-muted">
                  <Hotel className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun séjour enregistré</p>
                </div>
              ) : (
                hotelBookings.map((booking) => (
                  <div key={booking.id} className="card-gold">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Bed className="w-4 h-4 text-hotel" />
                          <span className="font-semibold text-ivory">
                            Chambre {booking.room?.number || booking.room_id}
                          </span>
                          <span className="pill pill-royal text-xs">
                            {booking.room?.type || 'Standard'}
                          </span>
                        </div>
                        <p className="text-sm text-ivory-muted">
                          {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                        </p>
                      </div>
                      <span
                        className={`pill text-xs ${
                          booking.status === 'checked_in'
                            ? 'pill-emerald'
                            : booking.status === 'confirmed'
                            ? 'pill-gold'
                            : 'pill-bordeaux'
                        }`}
                      >
                        {booking.status === 'checked_in' ? 'En cours' : booking.status}
                      </span>
                    </div>
                    {booking.total_amount && (
                      <div className="mt-3 pt-3 border-t border-palace-charcoal text-right">
                        <span className="text-gold font-bold">
                          {formatCurrency(booking.total_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'resto' && (
            <div className="space-y-4">
              {reservations.length === 0 ? (
                <div className="text-center py-12 text-ivory-muted">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune réservation enregistrée</p>
                </div>
              ) : (
                reservations.map((resa) => (
                  <div key={resa.id} className="card-gold">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-resto" />
                          <span className="font-semibold text-ivory">
                            {resa.time?.slice(0, 5)}
                          </span>
                          <span className="text-ivory-muted">-</span>
                          <span className="text-ivory-muted">{resa.guests} couverts</span>
                        </div>
                        <p className="text-sm text-ivory-muted">{formatDate(resa.date)}</p>
                      </div>
                      <span
                        className={`pill text-xs ${
                          resa.status === 'completed'
                            ? 'pill-emerald'
                            : resa.status === 'confirmed'
                            ? 'pill-gold'
                            : resa.status === 'cancelled'
                            ? 'pill-ruby'
                            : 'pill-bordeaux'
                        }`}
                      >
                        {resa.status}
                      </span>
                    </div>
                    {resa.notes && (
                      <p className="mt-2 text-sm text-ivory-muted italic">"{resa.notes}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal création client
 */
function NewCustomerModal({ onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_vip: false,
    allergies: [],
    notes: '',
  });
  const [allergyInput, setAllergyInput] = useState('');

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !form.allergies.includes(allergyInput.trim())) {
      setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergy) => {
    setForm({ ...form, allergies: form.allergies.filter((a) => a !== allergy) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;

    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      console.error('Erreur création:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ivory">Nouveau client</h2>
          <button onClick={onClose} className="btn-ghost h-10 w-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Prénom *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="input-palace"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-ivory-muted mb-2">Nom *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="input-palace"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ivory-muted mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-palace"
            />
          </div>

          <div>
            <label className="block text-sm text-ivory-muted mb-2">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-palace"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_vip}
              onChange={(e) => setForm({ ...form, is_vip: e.target.checked })}
              className="w-4 h-4 rounded border-gold/50 bg-palace-navy"
            />
            <span className="text-sm text-ivory">Client VIP</span>
            <Crown className="w-4 h-4 text-gold" />
          </label>

          <div>
            <label className="block text-sm text-ivory-muted mb-2">Allergies</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                placeholder="Ajouter une allergie..."
                className="input-palace flex-1"
              />
              <button type="button" onClick={handleAddAllergy} className="btn-ghost h-14 px-4">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {form.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.allergies.map((allergy, i) => (
                  <span key={i} className="badge-allergy cursor-pointer" onClick={() => handleRemoveAllergy(allergy)}>
                    {allergy}
                    <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-ivory-muted mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Préférences, notes..."
              className="input-palace h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function ClientsPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVIP, setFilterVIP] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('is_vip', { ascending: false })
        .order('total_spent', { ascending: false });

      if (!error && data) setCustomers(data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCustomer(formData) {
    const { error } = await supabase.from('customers').insert(formData);
    if (!error) await loadCustomers();
  }

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (filterVIP) {
      result = result.filter((c) => c.is_vip);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.first_name?.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    return result;
  }, [customers, searchQuery, filterVIP]);

  const stats = useMemo(() => {
    const vipCount = customers.filter((c) => c.is_vip).length;
    const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
    const avgSpent = customers.length > 0 ? totalSpent / customers.length : 0;

    return { total: customers.length, vipCount, totalSpent, avgSpent };
  }, [customers]);

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
            <Users className="w-7 h-7 text-gold" />
            CRM Clients
          </h1>
          <p className="text-ivory-muted mt-1">
            Vue 360° de vos clients
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-gold">
          <Plus className="w-5 h-5" />
          Nouveau client
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Total clients"
          value={stats.total}
          colorClass="gold"
        />
        <KPICard
          icon={Crown}
          label="Clients VIP"
          value={stats.vipCount}
          colorClass="gold"
        />
        <KPICard
          icon={Euro}
          label="CA total"
          value={formatCurrency(stats.totalSpent)}
          colorClass="resto"
        />
        <KPICard
          icon={Star}
          label="Panier moyen"
          value={formatCurrency(stats.avgSpent)}
          colorClass="hotel"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory-muted" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-palace pl-10"
            />
          </div>
          <button
            onClick={() => setFilterVIP(!filterVIP)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterVIP
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-ivory-muted hover:text-ivory hover:bg-palace-charcoal border border-transparent'
            }`}
          >
            <Crown className="w-4 h-4" />
            VIP uniquement
          </button>
        </div>

        {/* Results */}
        <p className="text-sm text-ivory-muted mb-4">
          {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''} trouvé{filteredCustomers.length > 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-ivory-muted">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Aucun client trouvé</p>
            <button onClick={() => setShowNewModal(true)} className="btn-outline-gold mt-4">
              <Plus className="w-5 h-5" />
              Ajouter un client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={() => setSelectedCustomer(customer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewCustomerModal
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateCustomer}
        />
      )}

      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={loadCustomers}
        />
      )}
    </div>
  );
}
