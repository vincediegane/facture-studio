# Facture Studio

Application React + Vite pour créer des factures, choisir un modèle, prévisualiser le rendu, appliquer une logique freemium et télécharger une facture Excel `.xlsx`.

## Lancer

```bash
npm install
npm run dev
```

## Lancer avec Docker

```bash
docker compose up --build
```

Puis ouvrez :

- Application : `http://127.0.0.1:3005`
- API : `http://127.0.0.1:8080`
- PostgreSQL : `127.0.0.1:5432`
- Prometheus : `http://127.0.0.1:9090`
- Grafana : `http://127.0.0.1:3006` (`admin` / `admin`)

La stack Docker lance :

- `web` : React buildé et servi par Nginx;
- `api` : Spring Boot;
- `postgres` : base de données persistante.
- `prometheus` : collecte des métriques backend;
- `grafana` : dashboards de monitoring.

Compte admin créé automatiquement au démarrage :

- Email : `admin@facturestudio.local`
- Mot de passe : `Admin12345!`

Si l’inscription ou la connexion renvoie encore `403`, reconstruisez l’API pour charger la nouvelle configuration CORS/Security :

```bash
docker compose down
docker compose up --build
```

Pour arrêter :

```bash
docker compose down
```

Pour supprimer aussi les données PostgreSQL :

```bash
docker compose down -v
```

## Fonctionnalités

- Vitrine d'accueil hors sidebar, avec hero animé, exemples de factures, bénéfices, témoignages et pricing.
- Page vitrine avec présentation du projet et plans Gratuit / Premium.
- Builder de facture avec formulaire complet.
- 12 modèles avec prévisualisation, dont 8 premium.
- Limite gratuite de 5 exports Excel, stockée en local pour cette démo.
- Simulation Premium locale avec exports illimités et accès aux modèles premium.
- Export Excel avec mise en forme selon le modèle choisi.
- Impression de l’aperçu.
- Export PDF.
- Préparation d'email via client mail.
- Dashboard local avec revenus, clients, catalogue et dernières factures.
- Historique des exports et emails.
- Répertoire clients réutilisable.
- Catalogue produits/services réutilisable.
- Branding : logo texte, couleurs et signature.
- Bons de commande liés aux factures.
- Accès admin de supervision.
- Graphiques métier et base de monitoring Prometheus/Grafana.

## Packages commerciaux

Voir [docs/pricing-packages.md](docs/pricing-packages.md).

## Note backend

Un dossier `backend/` prépare une API Spring Boot pour l'authentification :

- inscription et connexion;
- JWT;
- profil utilisateur;
- plan Gratuit / Premium;
- compteur d'exports mensuels.
- clients;
- catalogue de prestations;
- historique de factures;
- quotas d'exports côté serveur;
- activation Premium mock;
- recommandations d'automatisations.

Le frontend utilise encore `localStorage` pour la démo. La prochaine étape consiste à connecter React à l'API Spring Boot, puis à déplacer les quotas et le statut premium côté serveur.

## Automatisations avec agents

Agents proposés :

- Agent relance : surveille les échéances et prépare les emails de relance.
- Agent conformité : vérifie TVA, informations entreprise, client, NINEA/RCCM et cohérence des totaux.
- Agent modèles : recommande le meilleur modèle selon secteur, client, devise et montant.
- Agent reporting : produit un résumé hebdomadaire du CA, factures impayées et clients actifs.
- Agent assistant facture : transforme un brief en facture préremplie.

## Fonctionnalités à ajouter

- Authentification complète reliée au backend.
- Paiement Premium via Stripe, PayDunya ou Wave selon le marché cible.
- Historique des factures et duplications rapides.
- Catalogue clients et produits/services.
- Envoi email directement depuis la plateforme.
- Export PDF en plus d'Excel.
- Numérotation automatique par année.
- Tableau de bord de revenus, impayés et taxes.
- Import de logo et couleurs de marque.
- Rôles équipe : admin, comptable, lecture seule.

## Prochaines intégrations techniques

- Les pages React sont connectées à l'API Spring Boot avec JWT.
- Le Premium passe par `/api/billing/premium/mock`.
- Chaque export Excel/PDF est enregistré via `/api/invoices/exports`.
- Clients, catalogue et historique sont chargés depuis les endpoints backend après connexion.
- Le navigateur ne conserve plus que le token JWT, le profil de session et les préférences de branding.
- Charger `exceljs` et `jspdf` en import dynamique pour réduire le bundle initial.

## Variables frontend

Par défaut, React appelle `http://127.0.0.1:8080`. Pour changer l'URL backend :

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080 npm run dev
```
