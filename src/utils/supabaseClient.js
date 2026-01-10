/**
 * HorecaOS - Supabase Client Configuration
 *
 * Ce fichier configure la connexion à Supabase pour l'ensemble de l'application.
 * Utilisé pour toutes les opérations CRUD sur la base de données.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://yuggcsbdlxmiyisabpey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Z2djc2JkbHhtaXlpc2FicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjA5MTIsImV4cCI6MjA4MTg5NjkxMn0.z7iJupObkPtnXNUEPKvXYE4zWSaQqTPhNdVehcXhqrc';

// Création du client Supabase avec options optimisées
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'horecaos',
    },
  },
});

/**
 * Helper pour gérer les erreurs Supabase de manière uniforme
 * @param {Object} response - Réponse Supabase { data, error }
 * @returns {Object} data si succès, throw si erreur
 */
export const handleSupabaseResponse = ({ data, error }) => {
  if (error) {
    console.error('[Supabase Error]:', error.message);
    throw new Error(error.message);
  }
  return data;
};

/**
 * Récupère la configuration business (modules activés)
 * @param {string} businessId - UUID du business
 * @returns {Promise<Object>} Configuration du business
 */
export const getBusinessConfig = async (businessId) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  return handleSupabaseResponse({ data, error });
};

/**
 * Récupère les modules activés pour un business
 * @param {string} businessId - UUID du business
 * @returns {Promise<Object>} Objet modules { hotel, restaurant, stock, sommelier }
 */
export const getActiveModules = async (businessId) => {
  const business = await getBusinessConfig(businessId);
  return business?.modules || {
    hotel: false,
    restaurant: false,
    stock: false,
    sommelier: false,
  };
};

export default supabase;
