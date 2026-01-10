-- ============================================================================
-- HorecaOS - MAGIC SEED SCRIPT
-- Script d'initialisation complet pour la démo
-- ============================================================================
-- Ce script :
-- 1. Supprime les données existantes (clean slate)
-- 2. Crée les tables si elles n'existent pas
-- 3. Désactive Row Level Security (prototype)
-- 4. Insère un scénario de démo complet
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : NETTOYAGE COMPLET
-- ============================================================================

-- Suppression des données existantes (ordre inverse des dépendances)
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE recipes CASCADE;
TRUNCATE TABLE menu_items CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE tables CASCADE;
TRUNCATE TABLE businesses CASCADE;

-- ============================================================================
-- ÉTAPE 2 : CRÉATION DES TABLES (IF NOT EXISTS)
-- ============================================================================

-- CONFIGURATION & MODULES
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    modules JSONB DEFAULT '{"hotel": false, "restaurant": false, "stock": false, "sommelier": false}',
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW()
);

-- STOCK & SOMMELLERIE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT, -- 'wine', 'food', 'beverage', 'supply'
    current_stock DECIMAL(10, 3) DEFAULT 0,
    min_stock_alert DECIMAL(10, 3) DEFAULT 5,
    unit TEXT DEFAULT 'unit', -- 'unit', 'kg', 'L', 'bottle'
    purchase_price DECIMAL(10, 2),
    details JSONB DEFAULT '{}',
    storage_area TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RESTAURANT : CARTE
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'starter', 'main', 'dessert', 'beverage'
    sales_price DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    allergens JSONB DEFAULT '[]', -- Liste des allergènes calculée
    created_at TIMESTAMP DEFAULT NOW()
);

-- RECETTES (Lien menu -> produits)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10, 3),
    unit TEXT DEFAULT 'unit'
);

-- CRM & EXPÉRIENCE CLIENT
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_vip BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    notes TEXT,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLES DE RESTAURANT
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    zone TEXT, -- 'terrasse', 'salle', 'salon_prive'
    capacity INTEGER DEFAULT 4,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    status TEXT DEFAULT 'free' -- 'free', 'occupied', 'reserved'
);

-- COMMANDES
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id),
    customer_id UUID REFERENCES customers(id),
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'served', 'paid', 'cancelled'
    total_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

-- LIGNES DE COMMANDE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    product_id UUID REFERENCES products(id), -- Pour vins directs
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    notes TEXT,
    status TEXT DEFAULT 'pending' -- 'pending', 'preparing', 'ready', 'served'
);

-- RÉSERVATIONS HÔTEL
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    room_number TEXT,
    check_in DATE,
    check_out DATE,
    status TEXT DEFAULT 'confirmed', -- 'confirmed', 'checked_in', 'checked_out', 'cancelled'
    rate_per_night DECIMAL(10, 2),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ÉTAPE 3 : DÉSACTIVATION DE LA SÉCURITÉ (RLS) - PROTOTYPE ONLY
-- ============================================================================

ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : DONNÉES DE DÉMONSTRATION
-- ============================================================================

-- ----------------------------------------
-- BUSINESS : Hôtel-Restaurant "Le Grand Luxe"
-- Tous modules activés
-- ----------------------------------------
INSERT INTO businesses (id, name, modules, currency) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Le Grand Luxe - Hôtel & Restaurant Gastronomique',
    '{
        "hotel": true,
        "restaurant": true,
        "stock": true,
        "sommelier": true
    }',
    'EUR'
);

-- ----------------------------------------
-- CAVE À VINS (Produits catégorie 'wine')
-- ----------------------------------------
INSERT INTO products (id, business_id, name, category, current_stock, min_stock_alert, unit, purchase_price, storage_area, details) VALUES
-- BORDEAUX
(
    'w0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Château Margaux 2015',
    'wine',
    6,
    2,
    'bottle',
    450.00,
    'Cave 1 - Casier A1',
    '{
        "vintage": 2015,
        "region": "Bordeaux",
        "appellation": "Margaux",
        "grape": ["Cabernet Sauvignon", "Merlot", "Petit Verdot"],
        "peak_drink": "2025-2045",
        "score_parker": 99,
        "serving_temp": "16-18°C",
        "decant_time": "2-3h"
    }'
),
(
    'w0000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Château Latour 2010',
    'wine',
    3,
    2,
    'bottle',
    680.00,
    'Cave 1 - Casier A2',
    '{
        "vintage": 2010,
        "region": "Bordeaux",
        "appellation": "Pauillac",
        "grape": ["Cabernet Sauvignon", "Merlot"],
        "peak_drink": "2025-2060",
        "score_parker": 100,
        "serving_temp": "17-18°C",
        "decant_time": "3-4h"
    }'
),
(
    'w0000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Petrus 2016',
    'wine',
    2,
    1,
    'bottle',
    2800.00,
    'Cave 1 - Casier Premium',
    '{
        "vintage": 2016,
        "region": "Bordeaux",
        "appellation": "Pomerol",
        "grape": ["Merlot"],
        "peak_drink": "2026-2060",
        "score_parker": 100,
        "serving_temp": "17°C",
        "decant_time": "2h"
    }'
),

-- BOURGOGNE
(
    'w0000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Romanée-Conti 2018',
    'wine',
    1,
    1,
    'bottle',
    12000.00,
    'Cave 1 - Coffre-fort',
    '{
        "vintage": 2018,
        "region": "Bourgogne",
        "appellation": "Romanée-Conti Grand Cru",
        "grape": ["Pinot Noir"],
        "peak_drink": "2030-2070",
        "score_parker": 100,
        "serving_temp": "15-16°C",
        "decant_time": "1h"
    }'
),
(
    'w0000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Meursault 1er Cru Perrières 2020',
    'wine',
    8,
    3,
    'bottle',
    120.00,
    'Cave 2 - Casier B3',
    '{
        "vintage": 2020,
        "region": "Bourgogne",
        "appellation": "Meursault 1er Cru",
        "grape": ["Chardonnay"],
        "peak_drink": "2024-2035",
        "score_parker": 94,
        "serving_temp": "12-14°C",
        "decant_time": "30min"
    }'
),

-- CHAMPAGNE
(
    'w0000001-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'Dom Pérignon 2012',
    'wine',
    12,
    4,
    'bottle',
    180.00,
    'Cave 2 - Frigo Champagne',
    '{
        "vintage": 2012,
        "region": "Champagne",
        "appellation": "Champagne",
        "grape": ["Chardonnay", "Pinot Noir"],
        "peak_drink": "2022-2040",
        "serving_temp": "8-10°C",
        "decant_time": "0"
    }'
),
(
    'w0000001-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'Krug Grande Cuvée',
    'wine',
    4,
    2,
    'bottle',
    220.00,
    'Cave 2 - Frigo Champagne',
    '{
        "vintage": null,
        "region": "Champagne",
        "appellation": "Champagne",
        "grape": ["Chardonnay", "Pinot Noir", "Pinot Meunier"],
        "peak_drink": "Now-2030",
        "serving_temp": "9-10°C"
    }'
),

-- VINS EN STOCK CRITIQUE (Alertes)
(
    'w0000001-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'Sancerre Blanc 2022',
    'wine',
    1,
    5,
    'bottle',
    28.00,
    'Cave 2 - Casier C1',
    '{
        "vintage": 2022,
        "region": "Loire",
        "appellation": "Sancerre",
        "grape": ["Sauvignon Blanc"],
        "peak_drink": "Now-2026",
        "serving_temp": "10-12°C"
    }'
),
(
    'w0000001-0000-0000-0000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'Côtes du Rhône Rouge 2021',
    'wine',
    2,
    6,
    'bottle',
    15.00,
    'Cave 2 - Casier C2',
    '{
        "vintage": 2021,
        "region": "Rhône",
        "appellation": "Côtes du Rhône",
        "grape": ["Grenache", "Syrah"],
        "peak_drink": "Now-2027",
        "serving_temp": "15-17°C"
    }'
);

-- ----------------------------------------
-- INGRÉDIENTS CUISINE (Produits catégorie 'food')
-- ----------------------------------------
INSERT INTO products (id, business_id, name, category, current_stock, min_stock_alert, unit, purchase_price, storage_area, details) VALUES
(
    'f0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Filet de Boeuf',
    'food',
    8.5,
    3,
    'kg',
    65.00,
    'Chambre Froide 1',
    '{"allergens": [], "supplier": "Boucherie Maison", "origin": "France - Limousin"}'
),
(
    'f0000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Foie Gras de Canard',
    'food',
    2.2,
    1,
    'kg',
    120.00,
    'Chambre Froide 1',
    '{"allergens": [], "supplier": "Ferme du Périgord", "origin": "France - Dordogne"}'
),
(
    'f0000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Homard Bleu',
    'food',
    4,
    2,
    'unit',
    45.00,
    'Vivier',
    '{"allergens": ["CRUSTACES"], "supplier": "Marée Bretonne", "origin": "France - Bretagne"}'
),
(
    'f0000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Truffe Noire du Périgord',
    'food',
    0.3,
    0.1,
    'kg',
    850.00,
    'Chambre Froide 2 - Premium',
    '{"allergens": [], "season": "Dec-Mar", "origin": "France - Périgord"}'
),
(
    'f0000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Beurre AOP Charentes-Poitou',
    'food',
    5,
    2,
    'kg',
    18.00,
    'Chambre Froide 1',
    '{"allergens": ["LAIT"], "supplier": "Laiterie Échiré"}'
),
(
    'f0000001-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'Farine T55',
    'food',
    12,
    5,
    'kg',
    1.50,
    'Réserve Sèche',
    '{"allergens": ["GLUTEN"], "supplier": "Moulin de Provence"}'
),
(
    'f0000001-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'Noix de Saint-Jacques',
    'food',
    24,
    10,
    'unit',
    8.50,
    'Chambre Froide 1',
    '{"allergens": ["MOLLUSQUES"], "origin": "France - Normandie"}'
),
(
    'f0000001-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'Huile de Noix',
    'food',
    2,
    1,
    'L',
    35.00,
    'Réserve Sèche',
    '{"allergens": ["FRUITS_A_COQUE"], "supplier": "Moulin du Périgord"}'
),
(
    'f0000001-0000-0000-0000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'Pâte de Pistache',
    'food',
    0.8,
    0.5,
    'kg',
    65.00,
    'Réserve Sèche',
    '{"allergens": ["FRUITS_A_COQUE"], "supplier": "Valrhona"}'
),

-- STOCK CRITIQUE
(
    'f0000001-0000-0000-0000-000000000010',
    '11111111-1111-1111-1111-111111111111',
    'Crème Fraîche Épaisse',
    'food',
    1.5,
    3,
    'kg',
    8.00,
    'Chambre Froide 1',
    '{"allergens": ["LAIT"], "supplier": "Laiterie Locale", "expiry_days": 7}'
);

-- ----------------------------------------
-- MENU GASTRONOMIQUE
-- ----------------------------------------
INSERT INTO menu_items (id, business_id, name, description, category, sales_price, is_available, allergens) VALUES
-- ENTRÉES
(
    'm0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Foie Gras Maison',
    'Foie gras de canard mi-cuit, chutney de figues, brioche toastée',
    'starter',
    38.00,
    true,
    '["GLUTEN"]'
),
(
    'm0000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Saint-Jacques Snackées',
    'Noix de Saint-Jacques, beurre noisette, salade de mâche à l''huile de noix',
    'starter',
    32.00,
    true,
    '["MOLLUSQUES", "LAIT", "FRUITS_A_COQUE"]'
),
(
    'm0000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Homard en Bellevue',
    'Demi-homard bleu, gelée de crustacés, mayonnaise légère aux herbes',
    'starter',
    58.00,
    true,
    '["CRUSTACES", "OEUF"]'
),

-- PLATS
(
    'm0000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Tournedos Rossini',
    'Filet de boeuf, foie gras poêlé, truffe noire, sauce Périgueux',
    'main',
    75.00,
    true,
    '[]'
),
(
    'm0000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Filet de Boeuf aux Morilles',
    'Filet de boeuf, sauce aux morilles, gratin dauphinois',
    'main',
    52.00,
    true,
    '["LAIT", "GLUTEN"]'
),
(
    'm0000001-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'Homard Thermidor',
    'Homard bleu entier, gratiné sauce mornay',
    'main',
    95.00,
    true,
    '["CRUSTACES", "LAIT", "GLUTEN"]'
),

-- DESSERTS
(
    'm0000001-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'Soufflé au Grand Marnier',
    'Soufflé chaud, glace vanille Bourbon',
    'dessert',
    18.00,
    true,
    '["OEUF", "LAIT", "GLUTEN"]'
),
(
    'm0000001-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'Fondant Chocolat Pistache',
    'Coeur coulant chocolat noir Valrhona, éclats de pistache, glace pistache',
    'dessert',
    16.00,
    true,
    '["OEUF", "LAIT", "GLUTEN", "FRUITS_A_COQUE"]'
),
(
    'm0000001-0000-0000-0000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'Assiette de Fromages Affinés',
    'Sélection de 5 fromages, confiture de cerises noires',
    'dessert',
    22.00,
    true,
    '["LAIT"]'
);

-- ----------------------------------------
-- RECETTES (Liens Menu -> Ingrédients)
-- ----------------------------------------
INSERT INTO recipes (menu_item_id, product_id, quantity_required, unit) VALUES
-- Foie Gras Maison
('m0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000002', 0.080, 'kg'),
('m0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000006', 0.050, 'kg'),

-- Saint-Jacques Snackées
('m0000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000007', 4, 'unit'),
('m0000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000005', 0.030, 'kg'),
('m0000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000008', 0.020, 'L'),

-- Homard en Bellevue
('m0000001-0000-0000-0000-000000000003', 'f0000001-0000-0000-0000-000000000003', 0.5, 'unit'),

-- Tournedos Rossini
('m0000001-0000-0000-0000-000000000004', 'f0000001-0000-0000-0000-000000000001', 0.200, 'kg'),
('m0000001-0000-0000-0000-000000000004', 'f0000001-0000-0000-0000-000000000002', 0.060, 'kg'),
('m0000001-0000-0000-0000-000000000004', 'f0000001-0000-0000-0000-000000000004', 0.010, 'kg'),

-- Filet de Boeuf aux Morilles
('m0000001-0000-0000-0000-000000000005', 'f0000001-0000-0000-0000-000000000001', 0.180, 'kg'),
('m0000001-0000-0000-0000-000000000005', 'f0000001-0000-0000-0000-000000000010', 0.100, 'kg'),

-- Homard Thermidor
('m0000001-0000-0000-0000-000000000006', 'f0000001-0000-0000-0000-000000000003', 1, 'unit'),
('m0000001-0000-0000-0000-000000000006', 'f0000001-0000-0000-0000-000000000005', 0.050, 'kg'),

-- Fondant Chocolat Pistache
('m0000001-0000-0000-0000-000000000008', 'f0000001-0000-0000-0000-000000000009', 0.020, 'kg');

-- ----------------------------------------
-- CLIENTS (CRM avec préférences JSONB)
-- ----------------------------------------
INSERT INTO customers (id, business_id, full_name, email, phone, is_vip, total_visits, total_spent, preferences, notes) VALUES
(
    'c0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Jean-Pierre Delacroix',
    'jp.delacroix@email.com',
    '+33 6 12 34 56 78',
    true,
    47,
    18520.00,
    '{
        "allergies": ["FRUITS_A_COQUE", "ARACHIDE"],
        "dislikes": ["coriandre", "ail"],
        "wine_pref": {
            "regions": ["Bourgogne", "Bordeaux"],
            "style": "Rouge puissant"
        },
        "room_pref": {
            "floor": "high",
            "view": "jardin",
            "pillow": "firm",
            "temperature": 19
        },
        "dietary": null,
        "occasions": ["anniversaire_mariage_15_juin"]
    }',
    'Client depuis 2018. Amateur de grands crus. Toujours demander Nicolas comme sommelier.'
),
(
    'c0000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Marie-Claire Fontaine',
    'mc.fontaine@email.com',
    '+33 6 98 76 54 32',
    true,
    32,
    12340.00,
    '{
        "allergies": ["GLUTEN", "LAIT"],
        "dislikes": [],
        "wine_pref": {
            "regions": ["Champagne", "Loire"],
            "style": "Blanc vif"
        },
        "room_pref": {
            "floor": "low",
            "view": "rue",
            "pillow": "soft",
            "extra_blanket": true
        },
        "dietary": "vegetarian",
        "occasions": []
    }',
    'Intolérante gluten et lactose. Proposer systématiquement les alternatives.'
),
(
    'c0000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Alexandre Dubois',
    'a.dubois@business.com',
    '+33 6 55 44 33 22',
    false,
    5,
    1280.00,
    '{
        "allergies": [],
        "wine_pref": {
            "budget": "moderate"
        },
        "room_pref": {},
        "dietary": null
    }',
    'Client corporate. Repas d''affaires.'
),
(
    'c0000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Sophie Laurent',
    'sophie.laurent@email.com',
    '+33 6 11 22 33 44',
    true,
    28,
    9870.00,
    '{
        "allergies": ["CRUSTACES", "MOLLUSQUES"],
        "dislikes": ["champignons"],
        "wine_pref": {
            "regions": ["Rhône"],
            "style": "Rouge épicé"
        },
        "room_pref": {
            "floor": "high",
            "quiet_room": true
        },
        "dietary": null
    }',
    'Allergie sévère aux fruits de mer. NE JAMAIS proposer de poissons préparés dans les mêmes ustensiles.'
),
(
    'c0000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Thomas Martin',
    'thomas.m@email.com',
    '+33 6 77 88 99 00',
    false,
    2,
    340.00,
    '{
        "allergies": [],
        "wine_pref": {},
        "room_pref": {}
    }',
    'Nouveau client. À fidéliser.'
);

-- ----------------------------------------
-- TABLES DU RESTAURANT
-- ----------------------------------------
INSERT INTO tables (id, business_id, name, zone, capacity, position_x, position_y, status) VALUES
-- Salle principale
('t0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Table 1', 'salle', 2, 100, 100, 'free'),
('t0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Table 2', 'salle', 2, 200, 100, 'occupied'),
('t0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Table 3', 'salle', 4, 300, 100, 'free'),
('t0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Table 4', 'salle', 4, 100, 200, 'reserved'),
('t0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Table 5', 'salle', 6, 200, 200, 'occupied'),
('t0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Table 6', 'salle', 4, 300, 200, 'free'),

-- Terrasse
('t0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Terrasse 1', 'terrasse', 2, 100, 400, 'free'),
('t0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Terrasse 2', 'terrasse', 4, 200, 400, 'occupied'),
('t0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Terrasse 3', 'terrasse', 4, 300, 400, 'free'),

-- Salon privé
('t0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Salon Margaux', 'salon_prive', 8, 500, 150, 'reserved'),
('t0000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Salon Pétrus', 'salon_prive', 12, 500, 300, 'free');

-- ----------------------------------------
-- COMMANDES EN COURS
-- ----------------------------------------
INSERT INTO orders (id, business_id, table_id, customer_id, status, total_amount, notes, created_at) VALUES
(
    'o0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    't0000001-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    'in_progress',
    0,
    'Client VIP - Allergie noix !',
    NOW() - INTERVAL '45 minutes'
),
(
    'o0000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    't0000001-0000-0000-0000-000000000005',
    'c0000001-0000-0000-0000-000000000003',
    'in_progress',
    0,
    'Repas d''affaires - 4 couverts',
    NOW() - INTERVAL '30 minutes'
),
(
    'o0000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    't0000001-0000-0000-0000-000000000008',
    NULL,
    'open',
    0,
    'Clients de passage',
    NOW() - INTERVAL '10 minutes'
);

-- ----------------------------------------
-- LIGNES DE COMMANDES
-- ----------------------------------------
INSERT INTO order_items (order_id, menu_item_id, product_id, quantity, unit_price, status, notes) VALUES
-- Commande 1 (VIP Delacroix)
('o0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000001', NULL, 1, 38.00, 'served', NULL),
('o0000001-0000-0000-0000-000000000001', 'm0000001-0000-0000-0000-000000000004', NULL, 1, 75.00, 'preparing', 'Cuisson: Saignant'),
('o0000001-0000-0000-0000-000000000001', NULL, 'w0000001-0000-0000-0000-000000000001', 1, 550.00, 'served', 'Château Margaux 2015'),

-- Commande 2 (Dubois - affaires)
('o0000001-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000002', NULL, 2, 32.00, 'ready', NULL),
('o0000001-0000-0000-0000-000000000002', 'm0000001-0000-0000-0000-000000000003', NULL, 2, 58.00, 'preparing', NULL),
('o0000001-0000-0000-0000-000000000002', NULL, 'w0000001-0000-0000-0000-000000000006', 1, 280.00, 'served', 'Dom Pérignon 2012'),

-- Commande 3 (Terrasse)
('o0000001-0000-0000-0000-000000000003', 'm0000001-0000-0000-0000-000000000009', NULL, 2, 22.00, 'pending', NULL);

-- ----------------------------------------
-- RÉSERVATIONS HÔTEL
-- ----------------------------------------
INSERT INTO bookings (id, business_id, customer_id, room_number, check_in, check_out, status, rate_per_night, special_requests) VALUES
(
    'b0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'c0000001-0000-0000-0000-000000000001',
    'Suite 501',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    'checked_in',
    650.00,
    'Oreiller ferme, température 19°C, vue jardin. Champagne en chambre à l''arrivée.'
),
(
    'b0000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'c0000001-0000-0000-0000-000000000002',
    'Chambre 302',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days',
    'checked_in',
    280.00,
    'Couverture supplémentaire. Produits sans gluten au petit-déjeuner.'
),
(
    'b0000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'c0000001-0000-0000-0000-000000000004',
    'Suite 502',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days',
    'confirmed',
    580.00,
    'Chambre calme en étage élevé. ATTENTION : Allergie sévère crustacés.'
),
(
    'b0000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Chambre 201',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '1 day',
    'checked_in',
    220.00,
    NULL
),
(
    'b0000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Chambre 205',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    'confirmed',
    220.00,
    'Late check-in prévu vers 22h'
);

-- ============================================================================
-- ÉTAPE 5 : VUES UTILES (Optionnel mais pratique)
-- ============================================================================

-- Vue des stocks critiques
CREATE OR REPLACE VIEW v_stock_alerts AS
SELECT
    p.id,
    p.name,
    p.category,
    p.current_stock,
    p.min_stock_alert,
    p.unit,
    p.storage_area,
    CASE
        WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
        WHEN p.current_stock < p.min_stock_alert THEN 'CRITICAL'
        WHEN p.current_stock < p.min_stock_alert * 1.5 THEN 'LOW'
        ELSE 'OK'
    END as stock_status
FROM products p
WHERE p.current_stock < p.min_stock_alert * 1.5
ORDER BY
    CASE
        WHEN p.current_stock <= 0 THEN 1
        WHEN p.current_stock < p.min_stock_alert THEN 2
        ELSE 3
    END,
    p.current_stock ASC;

-- Vue des allergènes par plat (via recettes)
CREATE OR REPLACE VIEW v_menu_allergens AS
SELECT
    mi.id as menu_item_id,
    mi.name as menu_item_name,
    mi.category,
    mi.sales_price,
    mi.is_available,
    COALESCE(
        (
            SELECT jsonb_agg(DISTINCT allergen)
            FROM recipes r
            JOIN products p ON r.product_id = p.id
            CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.details->>'allergens', '[]')::jsonb) as allergen
            WHERE r.menu_item_id = mi.id
        ),
        '[]'::jsonb
    ) as computed_allergens
FROM menu_items mi;

-- Vue des vins par apogée
CREATE OR REPLACE VIEW v_wines_by_peak AS
SELECT
    p.id,
    p.name,
    p.current_stock,
    p.storage_area,
    p.details->>'vintage' as vintage,
    p.details->>'region' as region,
    p.details->>'appellation' as appellation,
    p.details->>'peak_drink' as peak_drink,
    p.details->>'score_parker' as score_parker,
    p.details->>'serving_temp' as serving_temp,
    p.purchase_price,
    CASE
        WHEN p.details->>'peak_drink' ILIKE 'Now%' THEN 'READY_NOW'
        WHEN (p.details->>'peak_drink')::text ~ '^\d{4}'
             AND EXTRACT(YEAR FROM CURRENT_DATE) >= SPLIT_PART(p.details->>'peak_drink', '-', 1)::int THEN 'IN_PEAK'
        ELSE 'AGING'
    END as drinking_window
FROM products p
WHERE p.category = 'wine'
ORDER BY p.details->>'region', p.details->>'vintage';

-- ============================================================================
-- FIN DU SCRIPT MAGIC SEED
-- ============================================================================

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ HorecaOS Magic Seed completed successfully!';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - 1 Business (Le Grand Luxe) with all modules enabled';
    RAISE NOTICE '   - 9 Wines including premium Bordeaux & Burgundy';
    RAISE NOTICE '   - 10 Food ingredients with allergen tracking';
    RAISE NOTICE '   - 9 Menu items with recipes';
    RAISE NOTICE '   - 5 Customers (3 VIP with allergies)';
    RAISE NOTICE '   - 11 Tables across 3 zones';
    RAISE NOTICE '   - 3 Active orders';
    RAISE NOTICE '   - 5 Hotel bookings';
    RAISE NOTICE '   - 3 Utility views created';
END $$;
