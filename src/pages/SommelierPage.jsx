/**
 * SommelierPage - Module Cave & Vins
 * Placeholder pour ÉTAPE 3
 */

import { Wine } from 'lucide-react';

export default function SommelierPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-sommelier/20 flex items-center justify-center">
          <Wine className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Cave & Vins</h1>
          <p className="text-slate-400">Gestion de la sommellerie</p>
        </div>
      </div>

      <div className="card">
        <p className="text-slate-400 text-center py-12">
          Module Sommelier - WineCellar<br />
          <span className="text-slate-500 text-sm">À venir dans l'ÉTAPE 3</span>
        </p>
      </div>
    </div>
  );
}
