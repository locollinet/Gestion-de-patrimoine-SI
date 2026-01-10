/**
 * RestaurantPage - Module Restaurant
 * Placeholder pour ÉTAPE 3
 */

import { UtensilsCrossed } from 'lucide-react';

export default function RestaurantPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-resto/20 flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6 text-resto" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Restaurant</h1>
          <p className="text-slate-400">Plan de salle & Commandes</p>
        </div>
      </div>

      <div className="card">
        <p className="text-slate-400 text-center py-12">
          Module Restaurant - FloorPlan & OrderDrawer<br />
          <span className="text-slate-500 text-sm">À venir dans l'ÉTAPE 3</span>
        </p>
      </div>
    </div>
  );
}
