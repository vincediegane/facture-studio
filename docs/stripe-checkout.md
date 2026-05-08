# Stripe Checkout

## Variables requises

Ajoutez ces variables dans votre environnement local, Docker ou plateforme de déploiement :

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx
STRIPE_BRANCHES_PRICE_ID=price_xxx
STRIPE_SUCCESS_URL=http://localhost:3005?checkout=success
STRIPE_CANCEL_URL=http://localhost:3005?checkout=cancel
```

## Endpoints

- `GET /api/billing/subscription` : état de l'abonnement utilisateur.
- `POST /api/billing/checkout-session` : crée une session Stripe Checkout en mode abonnement.
- `POST /api/billing/webhook` : reçoit les événements Stripe et active Premium.
- `POST /api/billing/premium/mock` : fallback de démo conservé.

## Webhook Stripe

Configurez un endpoint Stripe vers :

```text
https://votre-api.com/api/billing/webhook
```

Événements recommandés :

- `checkout.session.completed`
- `customer.subscription.deleted`
- `customer.subscription.paused`

## Flux

1. L'utilisateur choisit une offre dans React.
2. React appelle `POST /api/billing/checkout-session`.
3. Spring Boot crée une Checkout Session Stripe.
4. React redirige vers `checkoutUrl`.
5. Stripe appelle le webhook après paiement.
6. Le backend passe l'utilisateur en `PREMIUM`.
