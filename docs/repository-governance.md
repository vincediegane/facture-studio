# Gouvernance Git

## Branches

- `dev` : branche par défaut, intégration continue du développement.
- `staging` : validation pré-production, alimentée par pull request depuis `dev`.
- `prod` : production, alimentée uniquement par pull request depuis `staging`.

## Règles recommandées

- Protéger `prod`.
- Interdire les push directs sur `prod`.
- Exiger au moins 1 revue avant merge vers `prod`.
- Exiger le passage de la CI avant merge.
- Utiliser le squash merge pour garder un historique propre.
- Utiliser des pull requests pour `dev -> staging` et `staging -> prod`.
- Garder les secrets hors du dépôt et utiliser les secrets GitHub Actions.
- Définir `dev` comme branche par défaut.
- Installer l'app GitHub Settings si vous souhaitez appliquer `.github/settings.yml` automatiquement.

## Environnements

- `dev` : tests fonctionnels rapides et intégration.
- `staging` : tests de recette et validation métier.
- `prod` : code stable déployé aux utilisateurs.

## Commandes de création locale

```bash
git checkout -b dev
git checkout -b staging
git checkout -b prod
git checkout dev
```
