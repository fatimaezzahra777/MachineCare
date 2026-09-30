# MachineCare API

API REST de suivi des machines et des pannes d'une entreprise industrielle située à Safi.
Elle centralise le parc de machines et les signalements de pannes, du signalement jusqu'à la résolution, et protège l'accès par JWT.

- **Jira** : `<lien du projet Jira>`
- **GitHub** : `<lien du dépôt>`

## Stack technique

| Élément | Technologie |
|---|---|
| Serveur | Node.js 22 + Express 5 |
| Base de données | MongoDB 7 + Mongoose |
| Authentification | JWT (`jsonwebtoken`) + hachage `bcryptjs` |
| Conteneurs | Docker + Docker Compose |
| Rechargement en développement | nodemon |

## Prérequis

- Docker et Docker Compose
- Git

Node.js n'est pas nécessaire pour lancer l'API : tout tourne dans Docker.

## Installation et lancement

```bash
# 1. Cloner le dépôt
git clone <url-du-depot>
cd MachineCare

# 2. Créer le fichier d'environnement
cp .env.example .env
# Puis éditer .env et définir un JWT_SECRET long et aléatoire :
#   openssl rand -hex 32

# 3. Démarrer l'API et MongoDB
docker compose up --build
```

L'API est disponible sur `http://localhost:3000`. Vérification :

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

Les logs doivent afficher `MongoDB connecté` puis `API sur le port 3000`.

### Commandes utiles

```bash
docker compose up -d          # démarrer en arrière-plan
docker compose logs -f api    # suivre les logs de l'API
docker compose down           # arrêter
docker compose down -v        # arrêter et supprimer les données MongoDB
```

### Développement (rechargement automatique)

Le code local est synchronisé dans le conteneur `api` grâce à un volume (`.:/app`). nodemon redémarre le serveur à chaque modification, sans reconstruire l'image. Il faut reconstruire (`docker compose up --build`) uniquement si `package.json` change.

Si le fichier `.env` est modifié, recréer le conteneur :

```bash
docker compose up -d --force-recreate api
```

## Variables d'environnement

Copier `.env.example` vers `.env`. Le fichier `.env` ne doit **jamais** être publié.

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port de l'API | `3000` |
| `MONGO_URI` | Adresse MongoDB (nom du service Docker) | `mongodb://mongo:27017/maintenance` |
| `JWT_SECRET` | Clé de signature des tokens | chaîne longue et aléatoire |
| `JWT_EXPIRES_IN` | Durée de validité du token | `1d` |
| `DEFAULT_USER_EMAIL` | E-mail du compte créé à l'installation | `admin@example.com` |
| `DEFAULT_USER_PASSWORD` | Mot de passe du compte par défaut | à changer |

## Architecture

```
src/
├── config/        connexion MongoDB
├── models/        schémas Mongoose (User, Machine, Panne)
├── routes/        définition des URL et des middlewares associés
├── controllers/   lecture de la requête, envoi de la réponse
├── services/      logique métier et règles de gestion
├── middlewares/   authentification JWT, gestion des erreurs
├── app.js         configuration d'Express
└── server.js      démarrage (connexion MongoDB puis écoute du port)
```

### Parcours d'une requête

```
Requête HTTP
  → Route
  → Middleware d'authentification (vérifie le JWT)
  → Contrôleur
  → Service (règles métier)
  → Modèle Mongoose → MongoDB
  → Réponse JSON
(toute erreur est traitée par le middleware d'erreurs)
```

## Modèles de données

**User** : `nom`, `email` (unique), `password` (haché, jamais renvoyé), `createdAt`, `updatedAt`

**Machine** : `reference` (unique), `nom`, `atelier`, `etat` (`disponible` | `en_maintenance` | `hors_service`), `createdAt`, `updatedAt`

**Panne** : `machine` (référence vers Machine), `description`, `statut` (`ouvert` | `en_cours` | `resolu`), `declaredBy` (référence vers User), `noteResolution`, `dateResolution`, `createdAt`, `updatedAt`

## Authentification

1. Au premier démarrage, un compte par défaut est créé à partir de `DEFAULT_USER_EMAIL` et `DEFAULT_USER_PASSWORD`.
2. `POST /api/auth/login` avec e-mail et mot de passe retourne un JWT.
3. Les routes protégées exigent l'en-tête :

```
Authorization: Bearer <token>
```

Les mots de passe sont hachés avec bcrypt. Tous les utilisateurs authentifiés ont les mêmes droits (pas de rôles).

## Endpoints

Toutes les routes sont préfixées par `/api`. Sauf `health` et `login`, elles nécessitent un JWT.

### Authentification et utilisateurs

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/login` | Connexion, retourne un JWT (public) |
| POST | `/users` | Créer un compte utilisateur |
| GET | `/users/me` | Consulter son profil |
| PUT | `/users/me` | Modifier son profil |

### Machines

| Méthode | Route | Description |
|---|---|---|
| POST | `/machines` | Créer une machine |
| GET | `/machines` | Lister (filtres : `?atelier=` et `?etat=`) |
| GET | `/machines/:id` | Détail d'une machine |
| PUT | `/machines/:id` | Modifier une machine |
| DELETE | `/machines/:id` | Supprimer une machine |
| GET | `/machines/:id/pannes` | Historique des signalements d'une machine |

### Pannes

| Méthode | Route | Description |
|---|---|---|
| POST | `/pannes` | Déclarer une panne |
| GET | `/pannes` | Lister (filtres : `?machine=` et `?statut=`) |
| GET | `/pannes/:id` | Détail d'une panne |
| PUT | `/pannes/:id` | Modifier une panne |
| PATCH | `/pannes/:id/statut` | Faire évoluer le statut |

### Exemples

Connexion :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changez_moi"}'
```

Créer une machine :

```bash
curl -X POST http://localhost:3000/api/machines \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reference":"MC-001","nom":"Presse hydraulique","atelier":"Atelier A","etat":"disponible"}'
```

Déclarer une panne :

```bash
curl -X POST http://localhost:3000/api/pannes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"machine":"<id_machine>","description":"Fuite d huile sur le circuit"}'
```

Résoudre une panne (la note est obligatoire) :

```bash
curl -X PATCH http://localhost:3000/api/pannes/<id>/statut \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"statut":"resolu","noteResolution":"Joint remplacé"}'
```

## Règles métier

- La référence d'une machine et l'e-mail d'un utilisateur sont uniques.
- Une panne doit avoir une description non vide et concerner une machine existante.
- Les statuts et états inconnus sont refusés.
- Cycle d'une panne : `ouvert` → `en_cours` → `resolu`.
- Le passage à `resolu` exige une `noteResolution` ; la `dateResolution` est enregistrée automatiquement.
- L'utilisateur qui déclare une panne est conservé dans `declaredBy`.
- Les dates de création et de modification sont gérées automatiquement.

### Suppression d'une machine ayant des signalements

Une machine qui possède déjà des signalements **ne peut pas être supprimée** : l'API répond `409 Conflict`. Ce choix préserve l'historique des pannes et évite les signalements orphelins. Pour retirer une machine du service, on la passe à l'état `hors_service`.

## Codes HTTP

| Code | Signification |
|---|---|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides (champ manquant, statut inconnu, description vide, identifiant mal formé) |
| 401 | Token absent, invalide ou expiré ; identifiants incorrects |
| 404 | Ressource introuvable (machine inexistante, par exemple) |
| 409 | Doublon (référence, e-mail) ou suppression impossible |
| 500 | Erreur interne du serveur |

Les erreurs ont toujours le même format :

```json
{ "message": "La description est obligatoire" }
```

## Tests

Une collection de requêtes (Postman ou Insomnia) se trouve dans `docs/` et couvre :

- le parcours complet : connexion, création d'une machine, déclaration d'une panne, passage à `en_cours`, puis `resolu` avec note ;
- un accès sans JWT (401) ;
- au moins deux cas de données invalides (référence en doublon, description vide, statut inconnu, machine inexistante).

## Gestion de projet

Le suivi est réalisé dans Jira (epics, user stories, sub-tasks), relié à GitHub. Les commits et les branches contiennent la clé Jira, par exemple `MC-12: ajout du login`.

## Auteur

`FatimaEzzahra Belissaoui`