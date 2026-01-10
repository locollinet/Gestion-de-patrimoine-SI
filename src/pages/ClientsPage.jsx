/**
 * ClientsPage - CRM Clients
 * Gestion des clients et préférences
 */

import { useEffect, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../utils/supabaseClient';
import {
  Users,
  Crown,
  AlertTriangle,
  Search,
  Wine,
  Hotel,
  Heart,
} from 'lucide-react';

export default function ClientsPage() {
  const { businessId } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [businessId]);

  const loadCustomers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('is_vip', { ascending: false })
      .order('total_spent', { ascending: false });

    setCustomers(data || []);
    setLoading(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
          <Users className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400">CRM & Préférences</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-900 border border-slate-800
                     text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((client) => (
          <CustomerCard key={client.id} client={client} />
        ))}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucun client trouvé</p>
        </div>
      )}
    </div>
  );
}

function CustomerCard({ client }) {
  const allergies = client.preferences?.allergies || [];
  const winePref = client.preferences?.wine_pref;
  const roomPref = client.preferences?.room_pref;

  return (
    <div className="card card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
            ${client.is_vip
              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : 'bg-slate-700'}`}>
            {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{client.full_name}</h3>
            <p className="text-sm text-slate-400">{client.total_visits} visites</p>
          </div>
        </div>
        {client.is_vip && (
          <span className="badge-vip">
            <Crown className="w-3 h-3" />
            VIP
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 py-3 border-y border-slate-800 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {client.total_spent?.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-slate-500">Total dépensé</div>
        </div>
      </div>

      {/* Allergies */}
      {allergies.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Allergies</p>
          <div className="flex flex-wrap gap-1">
            {allergies.map((allergy, i) => (
              <span key={i} className="badge-allergy">
                <AlertTriangle className="w-2.5 h-2.5" />
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Préférences */}
      <div className="space-y-2">
        {winePref?.regions && (
          <div className="flex items-center gap-2 text-sm">
            <Wine className="w-4 h-4 text-sommelier" />
            <span className="text-slate-400">
              {winePref.regions.join(', ')}
            </span>
          </div>
        )}
        {roomPref?.floor && (
          <div className="flex items-center gap-2 text-sm">
            <Hotel className="w-4 h-4 text-hotel" />
            <span className="text-slate-400">
              Étage {roomPref.floor === 'high' ? 'élevé' : 'bas'}
              {roomPref.view && `, vue ${roomPref.view}`}
            </span>
          </div>
        )}
        {client.preferences?.dietary && (
          <div className="flex items-center gap-2 text-sm">
            <Heart className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-400 capitalize">
              {client.preferences.dietary}
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <p className="mt-4 text-xs text-slate-500 italic line-clamp-2">
          {client.notes}
        </p>
      )}
    </div>
  );
}
