# PayDunya Checkout

## Variables requises

Ajoutez ces variables dans votre environnement local, Docker ou plateforme de déploiement :

```bash
PAYDUNYA_MASTER_KEY=your_master_key
PAYDUNYA_PRIVATE_KEY=your_private_key
PAYDUNYA_TOKEN=your_token
PAYDUNYA_API_BASE_URL=https://app.paydunya.com/sandbox-api/v1
PAYDUNYA_STORE_NAME=Facture Studio
PAYDUNYA_SUCCESS_URL=http://localhost:8080/api/billing/paydunya/return
PAYDUNYA_CANCEL_URL=http://localhost:8080/api/billing/paydunya/cancel
PAYDUNYA_CALLBACK_URL=http://localhost:8080/api/billing/paydunya/callback
PAYDUNYA_PREMIUM_AMOUNT=4900
PAYDUNYA_BRANCHES_AMOUNT=19900
```

Pour la production, utilisez :

```bash
PAYDUNYA_API_BASE_URL=https://app.paydunya.com/api/v1
```

## Endpoints

- `GET /api/billing/subscription` : état de l'abonnement utilisateur.
- `POST /api/billing/paydunya/checkout` : crée une facture PayDunya et retourne l'URL de paiement.
- `GET /api/billing/paydunya/return?token=...` : confirme le paiement après retour utilisateur.
- `POST /api/billing/paydunya/callback` : callback serveur PayDunya.
- `GET /api/billing/paydunya/cancel?token=...` : marque le paiement comme annulé.
- `POST /api/billing/premium/mock` : fallback de démo conservé.

## Flux

1. L'utilisateur choisit une offre dans React.
2. React appelle `POST /api/billing/paydunya/checkout`.
3. Spring Boot crée une facture checkout PayDunya.
4. React redirige vers l'URL PayDunya.
5. PayDunya renvoie ou notifie avec un `token`.
6. Le backend confirme la facture via l'API PayDunya.
7. Si le statut est `completed`, l'utilisateur passe en `PREMIUM`.

## Sécurité

Le backend vérifie le hash PayDunya retourné à la confirmation. Selon la documentation PayDunya, ce hash correspond au SHA-512 de la Master Key.
