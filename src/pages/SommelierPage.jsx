/**
 * SommelierPage - Module Cave & Vins
 *
 * Intègre :
 * - WineCellar : vue étiquettes avec filtres apogée/région/stock
 */

import { Wine } from 'lucide-react';
import WineCellar from '../components/sommelier/WineCellar';

export default function SommelierPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-sommelier/20 flex items-center justify-center">
          <Wine className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Cave & Vins</h1>
          <p className="text-slate-400">Gestion de la sommellerie</p>
        </div>
      </div>

      {/* Wine Cellar */}
      <WineCellar />
    </div>
  );
}
