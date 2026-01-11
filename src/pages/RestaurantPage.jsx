/**
 * RestaurantPage - Module Restaurant HorecaOS
 *
 * Intègre :
 * - FloorPlan : plan de salle graphique interactif
 * - OrderDrawer : panneau commande avec sécurité allergies
 * - RestaurantReservations : gestion des réservations liées au CRM
 */

import { useState } from 'react';
import { UtensilsCrossed, LayoutGrid, Calendar } from 'lucide-react';
import FloorPlan from '../components/restaurant/FloorPlan';
import OrderDrawer from '../components/restaurant/OrderDrawer';
import RestaurantReservations from '../components/restaurant/RestaurantReservations';

export default function RestaurantPage() {
  const [activeTab, setActiveTab] = useState('floor'); // floor, reservations
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
  };

  const tabs = [
    { id: 'floor', label: 'Plan de salle', icon: LayoutGrid },
    { id: 'reservations', label: 'Réservations', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-resto/20 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-resto" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ivory">Restaurant</h1>
            <p className="text-ivory-muted">Service & Réservations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-resto/20 text-resto border border-resto/30'
                  : 'text-ivory-muted hover:text-ivory hover:bg-palace-charcoal'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'floor' ? (
        <>
          <FloorPlan onTableSelect={handleTableSelect} />
          {selectedTable && (
            <OrderDrawer
              table={selectedTable}
              order={selectedOrder}
              onClose={handleCloseDrawer}
              onOrderUpdate={handleOrderUpdate}
            />
          )}
        </>
      ) : (
        <RestaurantReservations />
      )}
    </div>
  );
}
