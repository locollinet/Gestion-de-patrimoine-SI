/**
 * BusinessContext - Contexte global de l'établissement
 *
 * Gère :
 * - Les informations du business (nom, devise)
 * - Les modules activés (hotel, restaurant, stock, sommelier)
 * - État de chargement global
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

// ID du business par défaut (prototype)
const DEFAULT_BUSINESS_ID = '11111111-1111-1111-1111-111111111111';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [modules, setModules] = useState({
    hotel: false,
    restaurant: false,
    stock: false,
    sommelier: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', DEFAULT_BUSINESS_ID)
        .single();

      if (fetchError) throw fetchError;

      setBusiness(data);
      setModules(data.modules || {
        hotel: false,
        restaurant: false,
        stock: false,
        sommelier: false,
      });
    } catch (err) {
      console.error('Failed to load business:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    business,
    businessId: business?.id || DEFAULT_BUSINESS_ID,
    businessName: business?.name || 'HorecaOS',
    currency: business?.currency || 'EUR',
    modules,
    // Helpers pour vérifier si un module est actif
    hasHotel: modules.hotel === true,
    hasRestaurant: modules.restaurant === true,
    hasStock: modules.stock === true,
    hasSommelier: modules.sommelier === true,
    // États
    loading,
    error,
    // Actions
    reload: loadBusiness,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}

export default BusinessContext;
