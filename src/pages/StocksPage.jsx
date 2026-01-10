/**
 * StocksPage - Module Gestion des Stocks
 * Placeholder pour extensions futures
 */

import { Package } from 'lucide-react';

export default function StocksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
          <Package className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Stocks</h1>
          <p className="text-slate-400">Inventaire & Approvisionnements</p>
        </div>
      </div>

      <div className="card">
        <p className="text-slate-400 text-center py-12">
          Module Stocks - Gestion des inventaires<br />
          <span className="text-slate-500 text-sm">En développement</span>
        </p>
      </div>
    </div>
  );
}
