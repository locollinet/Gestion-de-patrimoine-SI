import { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import {
  Wine,
  UtensilsCrossed,
  Hotel,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Crown,
  AlertCircle,
} from 'lucide-react';

/**
 * HorecaOS - Application principale
 * Page de test pour valider le Setup (ÉTAPE 1)
 */
function App() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [businessData, setBusinessData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Test 1: Récupérer le business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .single();

      if (bizError) throw bizError;
      setBusinessData(business);

      // Test 2: Compter les données
      const [wines, customers, tables, bookings] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('category', 'wine'),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('tables').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id', { count: 'exact' }),
      ]);

      setStats({
        wines: wines.count || 0,
        customers: customers.count || 0,
        tables: tables.count || 0,
        bookings: bookings.count || 0,
      });

      setConnectionStatus('connected');
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      setConnectionStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-resto to-sommelier flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HorecaOS</h1>
        </div>
        <p className="text-slate-400">Système de gestion pour l'hôtellerie de luxe</p>
      </header>

      {/* Connection Status Card */}
      <div className="card mb-8">
        <div className="flex items-center gap-4">
          {connectionStatus === 'checking' && (
            <>
              <Loader2 className="w-8 h-8 text-hotel animate-spin" />
              <div>
                <h2 className="text-lg font-semibold text-white">Connexion en cours...</h2>
                <p className="text-slate-400">Test de connexion à Supabase</p>
              </div>
            </>
          )}
          {connectionStatus === 'connected' && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Connexion établie</h2>
                <p className="text-slate-400">Base de données Supabase connectée avec succès</p>
              </div>
            </>
          )}
          {connectionStatus === 'error' && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Erreur de connexion</h2>
                <p className="text-red-400">{error}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Business Info */}
      {businessData && (
        <div className="card mb-8">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Établissement
          </h3>
          <p className="text-2xl font-bold text-white mb-4">{businessData.name}</p>

          {/* Modules actifs */}
          <div className="flex flex-wrap gap-3">
            {businessData.modules?.hotel && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hotel/20 text-hotel border border-hotel/30">
                <Hotel className="w-4 h-4" />
                Hôtel
              </span>
            )}
            {businessData.modules?.restaurant && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-resto/20 text-resto border border-resto/30">
                <UtensilsCrossed className="w-4 h-4" />
                Restaurant
              </span>
            )}
            {businessData.modules?.sommelier && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sommelier/20 text-rose-300 border border-sommelier/30">
                <Wine className="w-4 h-4" />
                Sommellerie
              </span>
            )}
            {businessData.modules?.stock && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600">
                <Package className="w-4 h-4" />
                Stock
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="kpi-card">
            <div className="flex items-center gap-2 text-sommelier mb-1">
              <Wine className="w-5 h-5" />
            </div>
            <div className="kpi-value text-white">{stats.wines}</div>
            <div className="kpi-label">Vins en cave</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-2 text-hotel mb-1">
              <Crown className="w-5 h-5" />
            </div>
            <div className="kpi-value text-white">{stats.customers}</div>
            <div className="kpi-label">Clients CRM</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-2 text-resto mb-1">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="kpi-value text-white">{stats.tables}</div>
            <div className="kpi-label">Tables</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-2 text-hotel mb-1">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="kpi-value text-white">{stats.bookings}</div>
            <div className="kpi-label">Réservations</div>
          </div>
        </div>
      )}

      {/* Design System Preview */}
      <div className="card mb-8">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">
          Design System - Midnight Luxe
        </h3>

        {/* Buttons */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">Boutons Touch-First (h-14)</p>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary">
              <UtensilsCrossed className="w-5 h-5" />
              Restaurant
            </button>
            <button className="btn btn-hotel">
              <Hotel className="w-5 h-5" />
              Hôtel
            </button>
            <button className="btn btn-sommelier">
              <Wine className="w-5 h-5" />
              Cave
            </button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-danger">
              <AlertCircle className="w-5 h-5" />
              Danger
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">Badges</p>
          <div className="flex flex-wrap gap-3">
            <span className="badge-vip">
              <Crown className="w-3 h-3" />
              VIP
            </span>
            <span className="badge-allergy">
              <AlertTriangle className="w-3 h-3" />
              Allergie Noix
            </span>
            <span className="badge-stock-critical">
              <AlertCircle className="w-3 h-3" />
              Stock Critique
            </span>
            <span className="badge-stock-low">Stock Bas</span>
          </div>
        </div>

        {/* Table Status */}
        <div>
          <p className="text-sm text-slate-500 mb-3">Status Tables</p>
          <div className="flex gap-4">
            <div className="table-tile w-20 h-20 table-free">
              <span className="text-lg font-bold">T1</span>
              <span className="text-xs">Libre</span>
            </div>
            <div className="table-tile w-20 h-20 table-occupied">
              <span className="text-lg font-bold">T2</span>
              <span className="text-xs">Occupée</span>
            </div>
            <div className="table-tile w-20 h-20 table-reserved">
              <span className="text-lg font-bold">T3</span>
              <span className="text-xs">Réservée</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-600 text-sm">
        <p>HorecaOS v0.1 - ÉTAPE 1 : Setup & Data validé</p>
        <p className="mt-1">Exécutez le script SQL Magic Seed dans Supabase pour initialiser les données</p>
      </footer>
    </div>
  );
}

export default App;
