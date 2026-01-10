/**
 * RestaurantPage - Module Restaurant
 *
 * Intègre :
 * - FloorPlan : plan de salle graphique interactif
 * - OrderDrawer : panneau commande avec sécurité allergies
 */

import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import FloorPlan from '../components/restaurant/FloorPlan';
import OrderDrawer from '../components/restaurant/OrderDrawer';

export default function RestaurantPage() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleTableSelect = (table, order) => {
    setSelectedTable(table);
    setSelectedOrder(order);
  };

  const handleCloseDrawer = () => {
    setSelectedTable(null);
    setSelectedOrder(null);
  };

  const handleOrderUpdate = () => {
    // Le FloorPlan se rafraîchit automatiquement
    // On peut forcer un refresh ici si nécessaire
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-resto/20 flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6 text-resto" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Restaurant</h1>
          <p className="text-slate-400">Plan de salle & Commandes</p>
        </div>
      </div>

      {/* Floor Plan */}
      <FloorPlan onTableSelect={handleTableSelect} />

      {/* Order Drawer */}
      {selectedTable && (
        <OrderDrawer
          table={selectedTable}
          order={selectedOrder}
          onClose={handleCloseDrawer}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}
