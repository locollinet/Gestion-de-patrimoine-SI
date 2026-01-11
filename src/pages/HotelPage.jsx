/**
 * HotelPage - Module Hôtellerie Palace
 *
 * Fonctionnalités :
 * - Vue chambres par étage
 * - Check-in / Check-out
 * - Réservations du jour
 * - Profils clients intégrés
 */

import { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../utils/supabaseClient';
import {
  Hotel,
  Bed,
  Users,
  Key,
  DoorOpen,
  DoorClosed,
  Crown,
  AlertTriangle,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Plus,
  Check,
  X,
  Sparkles,
  Wifi,
  Coffee,
  Bath,
  Tv,
  Phone,
  ChevronRight,
  User,
  Mail,
  Building,
} from 'lucide-react';

export default function HotelPage() {
  const { businessId } = useBusiness();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedFloor, setSelectedFloor] = useState('all');

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes, customersRes] = await Promise.all([
        supabase
          .from('rooms')
          .select('*, current_guest:customers(*)')
          .eq('business_id', businessId)
          .order('room_number'),
        supabase
          .from('bookings')
          .select('*, customer:customers(*), room:rooms(*)')
          .eq('business_id', businessId)
          .gte('check_out', new Date().toISOString().split('T')[0])
          .order('check_in'),
        supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessId)
          .order('full_name'),
      ]);

      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      console.error('Hotel load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const available = rooms.filter(r => r.status === 'available').length;
    const cleaning = rooms.filter(r => r.status === 'cleaning').length;
    const today = new Date().toISOString().split('T')[0];
    const arrivalsToday = bookings.filter(b => b.check_in === today && b.status === 'confirmed').length;
    const departuresToday = bookings.filter(b => b.check_out === today && b.status === 'checked_in').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, available, cleaning, arrivalsToday, departuresToday, occupancyRate };
  }, [rooms, bookings]);

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    const grouped = {};
    rooms.forEach(room => {
      const floor = room.floor || 1;
      if (!grouped[floor]) grouped[floor] = [];
      grouped[floor].push(room);
    });
    return grouped;
  }, [rooms]);

  const floors = Object.keys(roomsByFloor).sort((a, b) => Number(b) - Number(a));

  // Today's movements
  const todayArrivals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => b.check_in === today && b.status === 'confirmed');
  }, [bookings]);

  const todayDepartures = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => b.check_out === today && b.status === 'checked_in');
  }, [bookings]);

  // Check-in action
  const handleCheckIn = async (booking) => {
    try {
      await Promise.all([
        supabase.from('bookings').update({ status: 'checked_in' }).eq('id', booking.id),
        supabase.from('rooms').update({
          status: 'occupied',
          current_guest_id: booking.customer_id
        }).eq('id', booking.room_id),
      ]);
      loadData();
    } catch (err) {
      console.error('Check-in error:', err);
    }
  };

  // Check-out action
  const handleCheckOut = async (booking) => {
    try {
      await Promise.all([
        supabase.from('bookings').update({ status: 'checked_out' }).eq('id', booking.id),
        supabase.from('rooms').update({
          status: 'cleaning',
          current_guest_id: null
        }).eq('id', booking.room_id),
      ]);
      loadData();
    } catch (err) {
      console.error('Check-out error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2a4a70] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/30">
            <Hotel className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f0e6]">Réception</h1>
            <p className="text-[#8a9ab0]">Gestion des chambres et arrivées</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-ghost h-12 px-4"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Building}
          label="Occupation"
          value={`${stats.occupancyRate}%`}
          color="gold"
          large
        />
        <StatCard
          icon={Bed}
          label="Disponibles"
          value={stats.available}
          color="emerald"
        />
        <StatCard
          icon={Users}
          label="Occupées"
          value={stats.occupied}
          color="royal"
        />
        <StatCard
          icon={Sparkles}
          label="Ménage"
          value={stats.cleaning}
          color="muted"
        />
        <StatCard
          icon={DoorOpen}
          label="Arrivées"
          value={stats.arrivalsToday}
          color="emerald"
          pulse={stats.arrivalsToday > 0}
        />
        <StatCard
          icon={DoorClosed}
          label="Départs"
          value={stats.departuresToday}
          color="gold"
          pulse={stats.departuresToday > 0}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e2a3d] pb-2">
        {[
          { id: 'rooms', label: 'Chambres', icon: Bed },
          { id: 'arrivals', label: 'Arrivées', icon: DoorOpen, badge: stats.arrivalsToday },
          { id: 'departures', label: 'Départs', icon: DoorClosed, badge: stats.departuresToday },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-[#1e3a5f] text-white'
                : 'text-[#8a9ab0] hover:text-[#f5f0e6] hover:bg-[#1e2a3d]'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#c9a962] text-[#0a0f1a] text-xs font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Floor Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${selectedFloor === 'all'
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-[#0d1321] text-[#8a9ab0] hover:text-white border border-[#1e2a3d]'
                }`}
            >
              Tous les étages
            </button>
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                  ${selectedFloor === floor
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-[#0d1321] text-[#8a9ab0] hover:text-white border border-[#1e2a3d]'
                  }`}
              >
                Étage {floor}
              </button>
            ))}
          </div>

          {/* Rooms Grid by Floor */}
          {(selectedFloor === 'all' ? floors : [selectedFloor]).map(floor => (
            <section key={floor} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/20 flex items-center justify-center">
                  <Building className="w-4 h-4 text-[#7fa8c9]" />
                </div>
                <h3 className="text-lg font-semibold text-[#f5f0e6]">Étage {floor}</h3>
                <span className="text-sm text-[#8a9ab0]">
                  ({roomsByFloor[floor]?.length || 0} chambres)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {roomsByFloor[floor]?.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={() => setSelectedRoom(room)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Arrivals Tab */}
      {activeTab === 'arrivals' && (
        <div className="space-y-4">
          {todayArrivals.length === 0 ? (
            <EmptyState icon={DoorOpen} message="Aucune arrivée prévue aujourd'hui" />
          ) : (
            todayArrivals.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                type="arrival"
                onAction={() => handleCheckIn(booking)}
              />
            ))
          )}
        </div>
      )}

      {/* Departures Tab */}
      {activeTab === 'departures' && (
        <div className="space-y-4">
          {todayDepartures.length === 0 ? (
            <EmptyState icon={DoorClosed} message="Aucun départ prévu aujourd'hui" />
          ) : (
            todayDepartures.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                type="departure"
                onAction={() => handleCheckOut(booking)}
              />
            ))
          )}
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          bookings={bookings.filter(b => b.room_id === selectedRoom.id)}
          onClose={() => setSelectedRoom(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, large, pulse }) {
  const colorClasses = {
    gold: 'from-[#c9a962]/20 to-transparent border-[#c9a962]/20 text-[#c9a962]',
    royal: 'from-[#1e3a5f]/30 to-transparent border-[#1e3a5f]/30 text-[#7fa8c9]',
    emerald: 'from-[#2d5a4a]/30 to-transparent border-[#2d5a4a]/30 text-[#6db89e]',
    muted: 'from-[#1e2a3d]/50 to-transparent border-[#1e2a3d] text-[#8a9ab0]',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${colorClasses[color]} border`}>
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      <Icon className="w-5 h-5 mb-2 opacity-70" />
      <p className={`font-bold text-[#f5f0e6] ${large ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-[#8a9ab0] uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function RoomCard({ room, onClick }) {
  const guest = room.current_guest;
  const isVIP = guest?.is_vip;

  const statusConfig = {
    available: { color: 'border-[#2d5a4a]/50 bg-[#2d5a4a]/10', text: 'text-[#6db89e]', label: 'Disponible' },
    occupied: { color: 'border-[#c9a962]/30 bg-[#c9a962]/5', text: 'text-[#c9a962]', label: 'Occupée' },
    cleaning: { color: 'border-[#8a9ab0]/30 bg-[#1e2a3d]/50', text: 'text-[#8a9ab0]', label: 'Ménage' },
    maintenance: { color: 'border-[#9b2335]/30 bg-[#9b2335]/10', text: 'text-[#e07a8a]', label: 'Maintenance' },
  };

  const typeLabels = {
    standard: 'Standard',
    deluxe: 'Deluxe',
    junior_suite: 'Junior Suite',
    suite: 'Suite',
    presidential: 'Présidentielle',
  };

  const status = statusConfig[room.status] || statusConfig.available;

  return (
    <button
      onClick={onClick}
      className={`
        room-card w-full text-left p-4 ${status.color} border-2
        hover:scale-[1.02] active:scale-[0.98] transition-all
      `}
    >
      {/* VIP Badge */}
      {isVIP && (
        <div className="absolute top-2 right-2">
          <span className="badge-vip">
            <Crown className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Room Number */}
      <div className={`text-2xl font-bold ${status.text} mb-1`}>{room.room_number}</div>

      {/* Type */}
      <div className="text-xs text-[#8a9ab0] mb-3">{typeLabels[room.room_type]}</div>

      {/* Guest Name if occupied */}
      {room.status === 'occupied' && guest && (
        <div className="text-sm text-[#f5f0e6] truncate mb-2">{guest.full_name}</div>
      )}

      {/* Status */}
      <div className={`text-xs font-medium ${status.text}`}>{status.label}</div>

      {/* Rate */}
      <div className="text-xs text-[#8a9ab0] mt-2">{room.base_rate}€/nuit</div>
    </button>
  );
}

function BookingCard({ booking, type, onAction }) {
  const customer = booking.customer;
  const room = booking.room;
  const isVIP = customer?.is_vip;
  const allergies = customer?.preferences?.allergies || [];

  return (
    <div className="card flex items-center gap-4 p-5">
      {/* Avatar */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0
        ${isVIP
          ? 'bg-gradient-to-br from-[#c9a962] to-[#d4b872] shadow-lg shadow-[#c9a962]/30'
          : 'bg-[#1e3a5f]'
        }`}
      >
        {customer?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#f5f0e6]">{customer?.full_name || booking.guest_name || 'Client'}</span>
          {isVIP && <span className="badge-vip"><Crown className="w-3 h-3" /> VIP</span>}
        </div>
        <div className="flex items-center gap-3 text-sm text-[#8a9ab0] mt-1">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {room?.room_number || booking.room_number}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {type === 'arrival' ? booking.check_in : booking.check_out}
          </span>
        </div>
        {allergies.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-[#e07a8a] text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>{allergies.join(', ')}</span>
          </div>
        )}
        {booking.special_requests && (
          <p className="text-xs text-[#8a9ab0] mt-2 line-clamp-1">{booking.special_requests}</p>
        )}
      </div>

      {/* Action */}
      <button
        onClick={onAction}
        className={`btn ${type === 'arrival' ? 'btn-hotel' : 'btn-gold'} h-12 px-5`}
      >
        {type === 'arrival' ? (
          <>
            <Key className="w-4 h-4" />
            Check-in
          </>
        ) : (
          <>
            <DoorClosed className="w-4 h-4" />
            Check-out
          </>
        )}
      </button>
    </div>
  );
}

function RoomDetailModal({ room, bookings, onClose, onRefresh }) {
  const guest = room.current_guest;
  const amenities = room.amenities || [];

  const amenityIcons = {
    wifi: Wifi,
    tv: Tv,
    minibar: Coffee,
    bathtub: Bath,
    jacuzzi: Bath,
    nespresso: Coffee,
    safe: Key,
  };

  const typeLabels = {
    standard: 'Chambre Standard',
    deluxe: 'Chambre Deluxe',
    junior_suite: 'Junior Suite',
    suite: 'Suite',
    presidential: 'Suite Présidentielle',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 card p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-[#1e3a5f]/30 to-transparent border-b border-[#1e2a3d]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-4xl font-bold text-[#f5f0e6] mb-1">{room.room_number}</div>
              <p className="text-[#7fa8c9]">{typeLabels[room.room_type]}</p>
              <p className="text-sm text-[#8a9ab0] mt-1">Étage {room.floor} • {room.capacity} pers. • {room.base_rate}€/nuit</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#1e2a3d] text-[#8a9ab0] hover:text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guest Info */}
        {room.status === 'occupied' && guest && (
          <div className="p-6 border-b border-[#1e2a3d]">
            <h3 className="text-sm font-medium text-[#8a9ab0] uppercase tracking-wider mb-3">Client actuel</h3>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                ${guest.is_vip
                  ? 'bg-gradient-to-br from-[#c9a962] to-[#d4b872]'
                  : 'bg-[#1e3a5f]'
                }`}
              >
                {guest.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#f5f0e6]">{guest.full_name}</span>
                  {guest.is_vip && <span className="badge-vip"><Crown className="w-3 h-3" /></span>}
                </div>
                <p className="text-sm text-[#8a9ab0]">{guest.email}</p>
              </div>
            </div>
            {guest.preferences?.allergies?.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-[#9b2335]/10 border border-[#9b2335]/30">
                <div className="flex items-center gap-2 text-[#e07a8a] text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Allergies: {guest.preferences.allergies.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        <div className="p-6 border-b border-[#1e2a3d]">
          <h3 className="text-sm font-medium text-[#8a9ab0] uppercase tracking-wider mb-3">Équipements</h3>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity, i) => {
              const Icon = amenityIcons[amenity] || Check;
              return (
                <span key={i} className="pill pill-royal">
                  <Icon className="w-3 h-3" />
                  {amenity}
                </span>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bookings */}
        {bookings.length > 0 && (
          <div className="p-6">
            <h3 className="text-sm font-medium text-[#8a9ab0] uppercase tracking-wider mb-3">Réservations</h3>
            <div className="space-y-3">
              {bookings.slice(0, 3).map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d1321]">
                  <div>
                    <span className="text-[#f5f0e6]">{booking.customer?.full_name || 'Client'}</span>
                    <div className="text-xs text-[#8a9ab0]">
                      {booking.check_in} → {booking.check_out}
                    </div>
                  </div>
                  <span className={`pill ${booking.status === 'checked_in' ? 'pill-gold' : 'pill-royal'}`}>
                    {booking.status === 'checked_in' ? 'En cours' : 'Confirmé'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 rounded-full bg-[#1e2a3d] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-[#8a9ab0]" />
      </div>
      <p className="text-[#8a9ab0]">{message}</p>
    </div>
  );
}
