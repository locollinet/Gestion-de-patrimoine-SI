# Configuration Supabase pour HorecaOS

## 📋 Instructions de configuration

Votre application HorecaOS est maintenant **complète et fonctionnelle** ! Suivez ces étapes simples pour la mettre en route :

---

## 1️⃣ Créer un projet Supabase (si ce n'est pas déjà fait)

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous ou créez un compte
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `HorecaOS` (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Choisissez la région la plus proche de vous
5. Cliquez sur **"Create new project"**
6. Attendez 1-2 minutes que le projet soit créé

---

## 2️⃣ Exécuter le script SQL de configuration

1. Dans votre projet Supabase, allez dans le menu de gauche :
   **SQL Editor** (icône de base de données)

2. Cliquez sur **"New query"**

3. Ouvrez le fichier `sql/000_clean_and_seed.sql` de ce projet

4. **Copiez TOUT le contenu** du fichier

5. **Collez-le** dans l'éditeur SQL de Supabase

6. Cliquez sur le bouton **"Run"** (en bas à droite)

7. ✅ Vous devriez voir un message de succès avec les statistiques :
   ```
   HorecaOS Database v2 Ready!
   - 11 rooms
   - 9 wines
   - 10 ingredients
   - 9 menu_items
   - 5 customers
   - 11 tables
   - 5 restaurant_reservations
   - 3 orders
   - 5 hotel_bookings
   ```

---

## 3️⃣ Vérifier les données

Dans le menu de gauche, allez dans **"Table Editor"**. Vous devriez voir toutes ces tables avec des données :

- ✅ `businesses` - Votre établissement "Le Grand Luxe"
- ✅ `products` - Vins et ingrédients
- ✅ `menu_items` - Carte du restaurant
- ✅ `customers` - Clients avec préférences et allergies
- ✅ `rooms` - Chambres d'hôtel (standard à présidentielle)
- ✅ `tables` - Tables du restaurant
- ✅ `restaurant_reservations` - Réservations restaurant
- ✅ `bookings` - Réservations hôtel
- ✅ `orders` - Commandes en cours
- ✅ `stock_movements` - Mouvements de stock

---

## 4️⃣ L'application est déjà configurée !

Les identifiants Supabase sont **déjà configurés** dans le fichier `src/utils/supabaseClient.js` :

```javascript
const SUPABASE_URL = 'https://yuggcsbdlxmiyisabpey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

✨ **Vous n'avez rien à changer !** Le script SQL a été exécuté sur cette base de données.

---

## 5️⃣ Lancer l'application

Dans votre terminal, exécutez :

```bash
npm run dev
```

Puis ouvrez votre navigateur sur : **http://localhost:5173**

---

## 🎯 Ce que vous pouvez faire maintenant

### 🏨 Module Hôtel (`/hotel`)
- ✅ Voir toutes les chambres par étage
- ✅ Check-in des arrivées du jour
- ✅ Check-out des départs
- ✅ Voir les clients VIP avec leurs préférences
- ✅ Alertes allergies automatiques

### 🍽️ Module Restaurant (`/restaurant`)
- ✅ Plan de salle interactif
- ✅ Créer des commandes
- ✅ Ajouter plats et vins avec vérification allergies en temps réel
- ✅ Gérer les réservations
- ✅ Voir les tables occupées/disponibles

### 📦 Module Stocks (`/stocks`)
- ✅ Voir tous les produits (vins + ingrédients)
- ✅ Alertes stock critique/bas
- ✅ Faire des entrées de stock (livraison)
- ✅ Faire des sorties de stock (perte, transfert)
- ✅ Historique des mouvements
- ✅ Recherche et filtres

### 🍷 Module Sommelier (`/sommelier`)
- ✅ Cave digitale avec étiquettes visuelles
- ✅ Filtres par région, millésime, apogée
- ✅ Score Parker, température de service
- ✅ Temps de carafage recommandé
- ✅ Badge "À son apogée" doré

### 👥 Module Clients (`/clients`)
- ✅ CRM complet avec profil 360°
- ✅ Historique séjours hôtel
- ✅ Historique restaurant
- ✅ Gestion des allergies et préférences
- ✅ Statut VIP

---

## 🧪 Données de test incluses

Le script SQL crée automatiquement :

### Clients VIP
- **Jean-Pierre Delacroix** - Amateur de grands crus, allergie aux noix
- **Marie-Claire Fontaine** - Végétarienne, intolérante gluten/lactose
- **Sophie Laurent** - Allergie fruits de mer

### Chambres d'hôtel
- Étage 2 : Chambres standard et deluxe
- Étage 3-4 : Junior suites
- Étage 5 : Suites
- Étage 6 : Suite Présidentielle (1500€/nuit)

### Vins prestigieux
- Château Margaux 2015
- Romanée-Conti 2018 (12 000€ la bouteille !)
- Dom Pérignon 2012
- Et bien d'autres...

### Plats gastronomiques
- Tournedos Rossini
- Homard Thermidor
- Foie Gras Maison
- Saint-Jacques Snackées

---

## 🔧 Résolution de problèmes

### L'application ne charge pas les données ?

1. Vérifiez que le script SQL s'est bien exécuté dans Supabase
2. Vérifiez dans **Table Editor** que les tables contiennent des données
3. Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles

### Les modules sont grisés dans la sidebar ?

Normal ! Ils deviennent actifs quand vous allez sur `/hotel`, `/restaurant`, etc.

---

## 🚀 Prochaines étapes

Votre application est **100% fonctionnelle** ! Vous pouvez :

1. **Tester toutes les fonctionnalités** avec les données fictives
2. **Personnaliser** le nom de l'établissement dans Supabase (table `businesses`)
3. **Ajouter vos propres** :
   - Chambres
   - Plats
   - Vins
   - Clients
   - Tables

---

## 📝 Notes importantes

- 🔒 **RLS désactivé** : Pour faciliter le développement, la sécurité Row Level Security est désactivée. Activez-la en production !
- 🆔 **Business ID** : L'ID du business par défaut est `11111111-1111-1111-1111-111111111111`
- 💾 **Données persistantes** : Toutes les modifications sont sauvegardées en temps réel dans Supabase

---

Bon développement ! 🎉
