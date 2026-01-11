-- ============================================================================
-- HorecaOS - CLEAN & SEED SCRIPT v2 (Complete)
-- ============================================================================
-- INSTRUCTIONS :
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Coller ce script en entier
-- 3. Cliquer "Run"
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : SUPPRESSION COMPLÈTE
-- ============================================================================

DROP VIEW IF EXISTS v_wines_by_peak CASCADE;
DROP VIEW IF EXISTS v_menu_allergens CASCADE;
DROP VIEW IF EXISTS v_stock_alerts CASCADE;
DROP VIEW IF EXISTS v_room_availability CASCADE;

DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS restaurant_reservations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- ============================================================================
-- ÉTAPE 2 : CRÉATION DES TABLES
-- ============================================================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    modules JSONB DEFAULT '{"hotel": false, "restaurant": false, "stock": false, "sommelier": false}',
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    current_stock DECIMAL(10, 3) DEFAULT 0,
    min_stock_alert DECIMAL(10, 3) DEFAULT 5,
    unit TEXT DEFAULT 'unit',
    purchase_price DECIMAL(10, 2),
    details JSONB DEFAULT '{}',
    storage_area TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    sales_price DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    allergens JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10, 3),
    unit TEXT DEFAULT 'unit'
);

CREATE TABLE customers (
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

-- CHAMBRES (NEW)
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_type TEXT DEFAULT 'standard',
    floor INTEGER DEFAULT 1,
    capacity INTEGER DEFAULT 2,
    base_rate DECIMAL(10, 2) DEFAULT 200.00,
    amenities JSONB DEFAULT '[]',
    status TEXT DEFAULT 'available',
    current_guest_id UUID REFERENCES customers(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    zone TEXT,
    capacity INTEGER DEFAULT 4,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    status TEXT DEFAULT 'free'
);

-- RÉSERVATIONS RESTAURANT (NEW)
CREATE TABLE restaurant_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    table_id UUID REFERENCES tables(id),
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    covers INTEGER DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    source TEXT DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id),
    customer_id UUID REFERENCES customers(id),
    status TEXT DEFAULT 'open',
    covers INTEGER DEFAULT 1,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    notes TEXT,
    status TEXT DEFAULT 'pending'
);

-- RÉSERVATIONS HÔTEL
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    room_id UUID REFERENCES rooms(id),
    room_number TEXT,
    check_in DATE,
    check_out DATE,
    status TEXT DEFAULT 'confirmed',
    rate_per_night DECIMAL(10, 2),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MOUVEMENTS DE STOCK (NEW)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id),
    quantity DECIMAL(10, 3) NOT NULL,
    movement_type TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ÉTAPE 3 : DÉSACTIVATION RLS
-- ============================================================================

ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : DONNÉES
-- ============================================================================

-- BUSINESS
INSERT INTO businesses (id, name, modules, currency) VALUES
('11111111-1111-1111-1111-111111111111', 'Le Grand Luxe - Hôtel & Restaurant Gastronomique', '{"hotel": true, "restaurant": true, "stock": true, "sommelier": true}', 'EUR');

-- VINS
INSERT INTO products (id, business_id, name, category, current_stock, min_stock_alert, unit, purchase_price, storage_area, details) VALUES
('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Château Margaux 2015', 'wine', 6, 2, 'bottle', 450.00, 'Cave 1 - Casier A1', '{"vintage": 2015, "region": "Bordeaux", "appellation": "Margaux", "grape": ["Cabernet Sauvignon", "Merlot"], "peak_drink": "2025-2045", "score_parker": 99, "serving_temp": "16-18°C", "decant_time": "2-3h"}'),
('a0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Château Latour 2010', 'wine', 3, 2, 'bottle', 680.00, 'Cave 1 - Casier A2', '{"vintage": 2010, "region": "Bordeaux", "appellation": "Pauillac", "grape": ["Cabernet Sauvignon", "Merlot"], "peak_drink": "2025-2060", "score_parker": 100, "serving_temp": "17-18°C", "decant_time": "3-4h"}'),
('a0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Petrus 2016', 'wine', 2, 1, 'bottle', 2800.00, 'Cave 1 - Casier Premium', '{"vintage": 2016, "region": "Bordeaux", "appellation": "Pomerol", "grape": ["Merlot"], "peak_drink": "2026-2060", "score_parker": 100, "serving_temp": "17°C", "decant_time": "2h"}'),
('a0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Romanée-Conti 2018', 'wine', 1, 1, 'bottle', 12000.00, 'Cave 1 - Coffre-fort', '{"vintage": 2018, "region": "Bourgogne", "appellation": "Romanée-Conti Grand Cru", "grape": ["Pinot Noir"], "peak_drink": "2030-2070", "score_parker": 100, "serving_temp": "15-16°C", "decant_time": "1h"}'),
('a0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Meursault 1er Cru Perrières 2020', 'wine', 8, 3, 'bottle', 120.00, 'Cave 2 - Casier B3', '{"vintage": 2020, "region": "Bourgogne", "appellation": "Meursault 1er Cru", "grape": ["Chardonnay"], "peak_drink": "Now-2035", "score_parker": 94, "serving_temp": "12-14°C", "decant_time": "30min"}'),
('a0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Dom Pérignon 2012', 'wine', 12, 4, 'bottle', 180.00, 'Cave 2 - Frigo Champagne', '{"vintage": 2012, "region": "Champagne", "appellation": "Champagne", "grape": ["Chardonnay", "Pinot Noir"], "peak_drink": "Now-2040", "serving_temp": "8-10°C"}'),
('a0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Krug Grande Cuvée', 'wine', 4, 2, 'bottle', 220.00, 'Cave 2 - Frigo Champagne', '{"vintage": null, "region": "Champagne", "appellation": "Champagne", "grape": ["Chardonnay", "Pinot Noir", "Pinot Meunier"], "peak_drink": "Now-2030", "serving_temp": "9-10°C"}'),
('a0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Sancerre Blanc 2022', 'wine', 1, 5, 'bottle', 28.00, 'Cave 2 - Casier C1', '{"vintage": 2022, "region": "Loire", "appellation": "Sancerre", "grape": ["Sauvignon Blanc"], "peak_drink": "Now-2026", "serving_temp": "10-12°C"}'),
('a0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Côtes du Rhône Rouge 2021', 'wine', 2, 6, 'bottle', 15.00, 'Cave 2 - Casier C2', '{"vintage": 2021, "region": "Rhône", "appellation": "Côtes du Rhône", "grape": ["Grenache", "Syrah"], "peak_drink": "Now-2027", "serving_temp": "15-17°C"}');

-- INGRÉDIENTS
INSERT INTO products (id, business_id, name, category, current_stock, min_stock_alert, unit, purchase_price, storage_area, details) VALUES
('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Filet de Boeuf', 'food', 8.5, 3, 'kg', 65.00, 'Chambre Froide 1', '{"allergens": [], "supplier": "Boucherie Maison"}'),
('b0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Foie Gras de Canard', 'food', 2.2, 1, 'kg', 120.00, 'Chambre Froide 1', '{"allergens": []}'),
('b0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Homard Bleu', 'food', 4, 2, 'unit', 45.00, 'Vivier', '{"allergens": ["CRUSTACES"]}'),
('b0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Truffe Noire du Périgord', 'food', 0.3, 0.1, 'kg', 850.00, 'Chambre Froide 2', '{"allergens": []}'),
('b0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Beurre AOP Charentes', 'food', 5, 2, 'kg', 18.00, 'Chambre Froide 1', '{"allergens": ["LAIT"]}'),
('b0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Farine T55', 'food', 12, 5, 'kg', 1.50, 'Réserve Sèche', '{"allergens": ["GLUTEN"]}'),
('b0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Noix de Saint-Jacques', 'food', 24, 10, 'unit', 8.50, 'Chambre Froide 1', '{"allergens": ["MOLLUSQUES"]}'),
('b0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Huile de Noix', 'food', 2, 1, 'L', 35.00, 'Réserve Sèche', '{"allergens": ["FRUITS_A_COQUE"]}'),
('b0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Pâte de Pistache', 'food', 0.8, 0.5, 'kg', 65.00, 'Réserve Sèche', '{"allergens": ["FRUITS_A_COQUE"]}'),
('b0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Crème Fraîche Épaisse', 'food', 1.5, 3, 'kg', 8.00, 'Chambre Froide 1', '{"allergens": ["LAIT"]}');

-- MENU
INSERT INTO menu_items (id, business_id, name, description, category, sales_price, is_available, allergens) VALUES
('c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Foie Gras Maison', 'Foie gras mi-cuit, chutney de figues, brioche toastée', 'starter', 38.00, true, '["GLUTEN"]'),
('c0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Saint-Jacques Snackées', 'Noix de Saint-Jacques, beurre noisette, mâche à l''huile de noix', 'starter', 32.00, true, '["MOLLUSQUES", "LAIT", "FRUITS_A_COQUE"]'),
('c0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Homard en Bellevue', 'Demi-homard bleu, gelée de crustacés, mayonnaise aux herbes', 'starter', 58.00, true, '["CRUSTACES", "OEUF"]'),
('c0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Tournedos Rossini', 'Filet de boeuf, foie gras poêlé, truffe noire, sauce Périgueux', 'main', 75.00, true, '[]'),
('c0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Filet de Boeuf aux Morilles', 'Filet de boeuf, sauce aux morilles, gratin dauphinois', 'main', 52.00, true, '["LAIT", "GLUTEN"]'),
('c0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Homard Thermidor', 'Homard bleu entier, gratiné sauce mornay', 'main', 95.00, true, '["CRUSTACES", "LAIT", "GLUTEN"]'),
('c0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Soufflé au Grand Marnier', 'Soufflé chaud, glace vanille Bourbon', 'dessert', 18.00, true, '["OEUF", "LAIT", "GLUTEN"]'),
('c0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Fondant Chocolat Pistache', 'Coeur coulant chocolat noir, éclats de pistache, glace pistache', 'dessert', 16.00, true, '["OEUF", "LAIT", "GLUTEN", "FRUITS_A_COQUE"]'),
('c0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Assiette de Fromages Affinés', 'Sélection de 5 fromages, confiture de cerises noires', 'dessert', 22.00, true, '["LAIT"]');

-- RECETTES
INSERT INTO recipes (menu_item_id, product_id, quantity_required, unit) VALUES
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 0.080, 'kg'),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000007', 4, 'unit'),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 0.030, 'kg'),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000008', 0.020, 'L'),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 0.5, 'unit'),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 0.200, 'kg'),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002', 0.060, 'kg'),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 0.010, 'kg'),
('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000001', 0.180, 'kg'),
('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000003', 1, 'unit'),
('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000009', 0.020, 'kg');

-- CLIENTS
INSERT INTO customers (id, business_id, full_name, email, phone, is_vip, total_visits, total_spent, preferences, notes) VALUES
('d0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Jean-Pierre Delacroix', 'jp.delacroix@email.com', '+33 6 12 34 56 78', true, 47, 18520.00, '{"allergies": ["FRUITS_A_COQUE", "ARACHIDE"], "dislikes": ["coriandre"], "wine_pref": {"regions": ["Bourgogne", "Bordeaux"]}, "room_pref": {"floor": "high", "view": "garden", "pillow": "firm"}}', 'Client depuis 2018. Amateur de grands crus.'),
('d0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Marie-Claire Fontaine', 'mc.fontaine@email.com', '+33 6 98 76 54 32', true, 32, 12340.00, '{"allergies": ["GLUTEN", "LAIT"], "dietary": "vegetarian"}', 'Intolérante gluten et lactose.'),
('d0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Alexandre Dubois', 'a.dubois@business.com', '+33 6 55 44 33 22', false, 5, 1280.00, '{"allergies": []}', 'Client corporate.'),
('d0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Sophie Laurent', 'sophie.laurent@email.com', '+33 6 11 22 33 44', true, 28, 9870.00, '{"allergies": ["CRUSTACES", "MOLLUSQUES"], "dislikes": ["champignons"]}', 'Allergie sévère fruits de mer.'),
('d0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Thomas Martin', 'thomas.m@email.com', '+33 6 77 88 99 00', false, 2, 340.00, '{"allergies": []}', 'Nouveau client.');

-- CHAMBRES (NEW)
INSERT INTO rooms (id, business_id, room_number, room_type, floor, capacity, base_rate, amenities, status, current_guest_id) VALUES
('10000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '201', 'standard', 2, 2, 220.00, '["wifi", "minibar", "safe", "tv"]', 'occupied', NULL),
('10000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '202', 'standard', 2, 2, 220.00, '["wifi", "minibar", "safe", "tv"]', 'available', NULL),
('10000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '203', 'standard', 2, 2, 220.00, '["wifi", "minibar", "safe", "tv"]', 'available', NULL),
('10000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '205', 'deluxe', 2, 2, 320.00, '["wifi", "minibar", "safe", "tv", "balcony"]', 'available', NULL),
('10000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '301', 'standard', 3, 2, 220.00, '["wifi", "minibar", "safe", "tv"]', 'available', NULL),
('10000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '302', 'deluxe', 3, 2, 320.00, '["wifi", "minibar", "safe", "tv", "balcony", "nespresso"]', 'occupied', 'd0000001-0000-0000-0000-000000000002'),
('10000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '303', 'deluxe', 3, 3, 380.00, '["wifi", "minibar", "safe", "tv", "balcony", "nespresso", "bathtub"]', 'cleaning', NULL),
('10000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '401', 'junior_suite', 4, 2, 450.00, '["wifi", "minibar", "safe", "tv", "balcony", "nespresso", "bathtub", "living_room"]', 'available', NULL),
('10000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '501', 'suite', 5, 4, 650.00, '["wifi", "minibar", "safe", "tv", "terrace", "nespresso", "jacuzzi", "living_room", "dining_room"]', 'occupied', 'd0000001-0000-0000-0000-000000000001'),
('10000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '502', 'suite', 5, 4, 580.00, '["wifi", "minibar", "safe", "tv", "terrace", "nespresso", "bathtub", "living_room"]', 'available', NULL),
('10000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', '601', 'presidential', 6, 6, 1500.00, '["wifi", "minibar", "safe", "tv", "terrace", "nespresso", "jacuzzi", "living_room", "dining_room", "kitchen", "butler_service"]', 'available', NULL);

-- TABLES
INSERT INTO tables (id, business_id, name, zone, capacity, position_x, position_y, status) VALUES
('e0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'T1', 'salle', 2, 100, 100, 'free'),
('e0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'T2', 'salle', 2, 200, 100, 'occupied'),
('e0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'T3', 'salle', 4, 300, 100, 'free'),
('e0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'T4', 'salle', 4, 100, 200, 'reserved'),
('e0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'T5', 'salle', 6, 200, 200, 'occupied'),
('e0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'T6', 'salle', 4, 300, 200, 'free'),
('e0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'T7', 'terrasse', 2, 100, 400, 'free'),
('e0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'T8', 'terrasse', 4, 200, 400, 'occupied'),
('e0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'T9', 'terrasse', 4, 300, 400, 'free'),
('e0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Margaux', 'salon_prive', 8, 500, 150, 'reserved'),
('e0000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Pétrus', 'salon_prive', 12, 500, 300, 'free');

-- RÉSERVATIONS RESTAURANT (NEW)
INSERT INTO restaurant_reservations (id, business_id, customer_id, table_id, guest_name, guest_phone, covers, reservation_date, reservation_time, status, notes, source) VALUES
('20000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000004', 'Jean-Pierre Delacroix', '+33 6 12 34 56 78', 2, CURRENT_DATE, '20:00', 'confirmed', 'VIP - Allergie noix', 'direct'),
('20000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'd0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000010', 'Sophie Laurent', '+33 6 11 22 33 44', 6, CURRENT_DATE, '20:30', 'confirmed', 'Anniversaire - Salon Margaux', 'direct'),
('20000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', NULL, 'e0000001-0000-0000-0000-000000000003', 'Famille Moreau', '+33 6 99 88 77 66', 4, CURRENT_DATE + 1, '19:30', 'confirmed', NULL, 'website'),
('20000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Entreprise ABC', '+33 1 23 45 67 89', 8, CURRENT_DATE + 2, '12:30', 'pending', 'Repas d''affaires - Menu à confirmer', 'phone'),
('20000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'd0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000001', 'Marie-Claire Fontaine', '+33 6 98 76 54 32', 2, CURRENT_DATE + 1, '20:00', 'confirmed', 'Régime sans gluten ni lactose', 'direct');

-- COMMANDES
INSERT INTO orders (id, business_id, table_id, customer_id, status, covers, notes, created_at) VALUES
('f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'in_progress', 2, 'Client VIP - Allergie noix !', NOW() - INTERVAL '45 minutes'),
('f0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000003', 'in_progress', 4, 'Repas affaires', NOW() - INTERVAL '30 minutes'),
('f0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'e0000001-0000-0000-0000-000000000008', NULL, 'open', 2, 'Clients de passage', NOW() - INTERVAL '10 minutes');

-- LIGNES DE COMMANDES
INSERT INTO order_items (order_id, menu_item_id, product_id, quantity, unit_price, status, notes) VALUES
('f0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', NULL, 1, 38.00, 'served', NULL),
('f0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', NULL, 1, 75.00, 'preparing', 'Cuisson: Saignant'),
('f0000001-0000-0000-0000-000000000001', NULL, 'a0000001-0000-0000-0000-000000000001', 1, 550.00, 'served', 'Château Margaux 2015'),
('f0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', NULL, 2, 32.00, 'ready', NULL),
('f0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000003', NULL, 2, 58.00, 'preparing', NULL),
('f0000001-0000-0000-0000-000000000002', NULL, 'a0000001-0000-0000-0000-000000000006', 1, 280.00, 'served', 'Dom Pérignon 2012'),
('f0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000009', NULL, 2, 22.00, 'pending', NULL);

-- RÉSERVATIONS HÔTEL
INSERT INTO bookings (id, business_id, customer_id, room_id, room_number, check_in, check_out, status, rate_per_night, special_requests) VALUES
('aa000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000009', 'Suite 501', CURRENT_DATE, CURRENT_DATE + 3, 'checked_in', 650.00, 'Oreiller ferme, température 19°C'),
('aa000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'd0000001-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000006', 'Chambre 302', CURRENT_DATE, CURRENT_DATE + 2, 'checked_in', 280.00, 'Produits sans gluten'),
('aa000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'd0000001-0000-0000-0000-000000000004', '10000001-0000-0000-0000-000000000010', 'Suite 502', CURRENT_DATE + 1, CURRENT_DATE + 4, 'confirmed', 580.00, 'Allergie crustacés'),
('aa000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', NULL, '10000001-0000-0000-0000-000000000001', 'Chambre 201', CURRENT_DATE - 1, CURRENT_DATE + 1, 'checked_in', 220.00, NULL),
('aa000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', NULL, '10000001-0000-0000-0000-000000000004', 'Chambre 205', CURRENT_DATE + 2, CURRENT_DATE + 5, 'confirmed', 320.00, 'Late check-in 22h');

-- ============================================================================
-- VUES UTILES
-- ============================================================================

CREATE OR REPLACE VIEW v_stock_alerts AS
SELECT p.*, b.name as business_name
FROM products p
JOIN businesses b ON p.business_id = b.id
WHERE p.current_stock < p.min_stock_alert;

CREATE OR REPLACE VIEW v_room_availability AS
SELECT r.*, b.name as business_name,
       CASE WHEN r.status = 'available' THEN true ELSE false END as is_available
FROM rooms r
JOIN businesses b ON r.business_id = b.id;

-- ============================================================================
-- RÉSULTAT
-- ============================================================================

SELECT 'HorecaOS Database v2 Ready!' as status,
       (SELECT COUNT(*) FROM rooms) as rooms,
       (SELECT COUNT(*) FROM products WHERE category = 'wine') as wines,
       (SELECT COUNT(*) FROM products WHERE category = 'food') as ingredients,
       (SELECT COUNT(*) FROM menu_items) as menu_items,
       (SELECT COUNT(*) FROM customers) as customers,
       (SELECT COUNT(*) FROM tables) as tables,
       (SELECT COUNT(*) FROM restaurant_reservations) as restaurant_reservations,
       (SELECT COUNT(*) FROM orders) as orders,
       (SELECT COUNT(*) FROM bookings) as hotel_bookings;
