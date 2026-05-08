# Facture Studio API

Backend Spring Boot préparé pour remplacer la simulation locale du frontend.

## Endpoints

- `POST /api/auth/register` : crée un utilisateur gratuit.
- `POST /api/auth/login` : connecte un utilisateur et retourne un JWT.
- `GET /api/auth/me` : retourne le profil authentifié.
- `GET /api/customers` / `POST /api/customers` : liste et création de clients.
- `GET /api/catalog` / `POST /api/catalog` : liste et création de prestations.
- `GET /api/invoices` : historique des factures.
- `POST /api/invoices/exports` : enregistre un export et applique le quota gratuit.
- `POST /api/billing/premium/mock` : active Premium en mode démo.
- `GET /api/automations/recommendations` : retourne les agents recommandés.
- `GET /api/purchase-orders` / `POST /api/purchase-orders` : bons de commande liés aux factures.
- `GET /api/admin/stats` : statistiques globales, réservé aux admins.
- `/actuator/prometheus` : métriques Prometheus.

## À ajouter ensuite

- Persistance PostgreSQL.
- Paiement Premium réel.
- Items détaillés de facture.
- Rôles équipe.
- Agents planifiés pour relances, conformité et reporting.

## Lancer

```bash
mvn spring-boot:run
```

Depuis la racine du projet, l'ensemble de la plateforme peut aussi être lancé avec Docker :

```bash
docker compose up --build
```

Java 17 est requis. Maven n'est pas installé globalement dans l'environnement actuel.

Dans cet espace de travail, Maven a aussi été téléchargé localement dans `.tools/` pour vérifier le backend :

```bash
../.tools/apache-maven-3.9.9/bin/mvn -f pom.xml test
```
