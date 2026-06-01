# 📚 Guide de Workflow - xam-xam

Guide pratique pour matcher et importer les 52 leçons Assimil.

---

## 🚀 Démarrage

```bash
npm run dev
```

Ouvre l'app à `localhost:5174`.

---

## 🪄 Ouvrir le Matcher

1. Cliquer l'icône **🪄** dans le header
2. S'ouvre dans un nouvel onglet : `localhost:5174/tools/matcher/index.html`

### Configuration initiale (une seule fois)

- Cliquer **"Sélectionner dossier repo"** → choisir `xam-xam/`
- Cliquer **"Sélectionner dossier Assimil"** → choisir le dossier avec les MP3
- Ces chemins sont mémorisés, pas besoin de les refaire

---

## 📖 Pour chaque leçon

### 1. Choisir la leçon

Cliquer sur une tuile **"A faire"** dans la grille → le MP3 Assimil se charge.

### 2. Découper l'audio

Cliquer **"Découper"** → le script coupe le MP3 en segments (~30-100 segments).

### 3. Matcher les segments

Pour **chaque segment** :

| Action | Bouton | Touche |
|--------|--------|--------|
| Écouter | ▶ | `Espace` |
| Français | **FR** | `F` |
| Wolof | **WO** | `W` |
| Lier au suivant* | **⛓** | `L` |
| Ignorer (bruit, titre) | **—** | `S` |

*Utiliser **⛓** si plusieurs segments appartiennent à la même carte (ex: "L'après-midi, Le soir" → une seule carte "Ci ngoon").

La colonne droite affiche les cartes construites en temps réel.

### 4. Vérifier les cartes

S'assurer que **chaque carte a un FR et un WO** (pas de "manquant" en rouge).

### 5. Exporter

Cliquer **"Exporter vers repo"** → écrit :
- Fichiers audio dans `public/audio/{leçon}/`
- JSON dans `scripts/output/lesson_{leçon}.json`

---

## 🔄 Synchroniser avec l'app

Dans le terminal, lancer :

```bash
node scripts/sync_to_app.js
```

Cela :
- Met à jour `src/data/imported.js` (cartes dans l'app)
- Marque la leçon **"Faite"** dans le Matcher

---

## ✅ Tester la leçon

1. Rafraîchir `localhost:5174`
2. La leçon apparaît avec ses cartes et ses audios
3. Si localStorage cache une ancienne version :
   ```javascript
   localStorage.removeItem('xam-xam-lessons')
   ```
   Puis appuyer sur F5.

---

## 💾 Committer

```bash
git add .
git commit -m "feat: lesson {nom}"
git push
```

---

## ⚠️ Cas particuliers

### Segments mal coupés

Si un segment est trop court ou trop long :
- Utiliser **—** (Skip) pour l'ignorer
- Remplir le texte manuellement dans l'**AdminEditor**

### AdminEditor

Accès via l'icône **⚙️** dans l'app (`localhost:5174`).
Permet de corriger les textes FR/WO après import.

### Segments liés (many-to-many)

Utiliser le bouton **⛓** ou la touche `L` pour lier plusieurs segments à une seule carte.

---

## 📊 Objectif

- Matcher les **52 leçons**
- Voir la progression dans le Matcher (tuiles vertes = "Faite")
- App **100% fonctionnelle hors-ligne**
