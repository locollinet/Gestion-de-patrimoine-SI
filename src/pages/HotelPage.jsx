/**
 * HotelPage - Module Hôtel
 * Placeholder pour extensions futures
 */

import { Hotel } from 'lucide-react';

export default function HotelPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-hotel/20 flex items-center justify-center">
          <Hotel className="w-6 h-6 text-hotel" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Hôtel</h1>
          <p className="text-slate-400">Réservations & Chambres</p>
        </div>
      </div>

      <div className="card">
        <p className="text-slate-400 text-center py-12">
          Module Hôtel - Gestion des réservations<br />
          <span className="text-slate-500 text-sm">En développement</span>
        </p>
      </div>
    </div>
  );
}
