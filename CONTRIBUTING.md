# Comment contribuer au projet

## Branches

| Branche | Rôle |
|---------|------|
| `main` | Production uniquement — ne jamais pousser directement |
| `developpement` | Branche de travail principale |
| `fonctionnalite/nom` | Une branche par fonctionnalité |
| `correction/nom` | Correction de bug |
| `iteration/n-nom` | Regroupement d'une itération complète |

## Flux de travail

```bash
# 1. Partir de developpement à jour
git checkout developpement
git pull

# 2. Créer sa branche
git checkout -b fonctionnalite/inscription-eleve

# 3. Travailler et commiter régulièrement
git add .
git commit -m "fonctionnalite: formulaire inscription élève"

# 4. Merger vers developpement
git checkout developpement
git merge fonctionnalite/inscription-eleve
git push

# 5. Supprimer la branche
git branch -d fonctionnalite/inscription-eleve
```

## Conventions de commits

```
type: description courte en français

Types: fonctionnalite / correction / configuration /
       base-donnees / style / test / documentation
```

## Conventions de code

Tout est en français : noms de variables, fichiers, commentaires, commits.

## Avant de pousser

- Le code compile sans erreurs TypeScript
- Pas de `.env` dans le commit
- Pas de `console.log` oubliés
- Pas de `node_modules` dans le commit

## Fin d'itération

```bash
git checkout main
git merge developpement
git tag -a v1.0 -m "Itération 1 — Noyau complet"
git push --tags
```
