# Automatisations et agents

Objectif : faire évoluer Facture Studio d'un générateur de factures vers un assistant de facturation.

## Agents prioritaires

### Agent relance

- Déclenchement : tous les matins.
- Entrées : factures non payées, date d'échéance, client.
- Sortie : brouillon d'email de relance et priorité.
- Backend requis : table `invoices`, statut `DRAFT/SENT/PAID/OVERDUE`, coordonnées client.

### Agent conformité

- Déclenchement : avant export ou avant envoi.
- Entrées : facture complète, pays, devise, TVA.
- Sortie : liste d'erreurs et recommandations.
- Exemples : NINEA/RCCM manquant, TVA incohérente, total négatif, date d'échéance absente.

### Agent recommandation modèle

- Déclenchement : ouverture du builder ou changement de client.
- Entrées : secteur client, montant, devise, plan utilisateur.
- Sortie : 3 modèles recommandés avec justification courte.

### Agent reporting

- Déclenchement : lundi matin.
- Entrées : factures de la semaine précédente.
- Sortie : résumé CA, impayés, clients actifs, actions recommandées.

### Agent assistant facture

- Déclenchement : saisie d'un brief.
- Entrées : phrase libre, catalogue services, client.
- Sortie : facture préremplie avec lignes et prix suggérés.

## Architecture recommandée

- Spring Boot pour comptes, factures, quotas, paiements et événements.
- Scheduler Spring `@Scheduled` pour tâches simples.
- Queue plus tard : RabbitMQ, Kafka ou BullMQ si on ajoute beaucoup de traitements.
- Journal `automation_runs` pour tracer chaque exécution.
- Notifications : email, dashboard, puis Slack/WhatsApp selon cible.

## Tables à prévoir

- `users`
- `customers`
- `invoices`
- `invoice_items`
- `plans`
- `payments`
- `automation_runs`
- `agent_recommendations`

## Première automatisation à coder

Commencer par l'Agent conformité, car il améliore immédiatement la qualité des exports et ne dépend pas d'intégrations externes.
