# Xam-Xam API

Backend FastAPI pour l'app d'apprentissage du Wolof.

## Setup

```bash
cd /home/claudeuser/xam-xam/scripts/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Lancer en dev

```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8787 --reload
```

## Installer le service systemd

```bash
sudo cp xam-xam-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable xam-xam-api
sudo systemctl start xam-xam-api
```

## Endpoints

| Methode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/split` | Upload audio + lesson_id, lance extract_audio.py, retourne les segments |
| `GET` | `/api/lessons` | Liste toutes les lecons (resume) |
| `GET` | `/api/lessons/{id}` | Detail d'une lecon avec ses cartes |
| `POST` | `/api/lessons` | Cree une nouvelle lecon (JSON body: `{id, title, description, cards}`) |
| `PUT` | `/api/lessons/{id}` | Met a jour une lecon (JSON body: `{title?, description?, cards?}`) |
| `DELETE` | `/api/lessons/{id}/cards/{card_id}` | Supprime une carte |
| `GET` | `/api/audio/{lesson_id}/{filename}` | Sert un fichier MP3 |
| `POST` | `/api/lessons/{id}/publish` | Publie la lecon dans `src/data/mock.js` |

### POST /api/split

Form data:
- `file`: fichier audio (mp3, m4a, wav...)
- `lesson_id`: identifiant de la lecon
- `first_lang`: `fr` ou `wo` (defaut: `fr`)
- `silence_thresh`: seuil silence en dBFS (defaut: `-40`)
- `min_silence`: duree min silence en ms (defaut: `700`)

### POST /api/lessons

```json
{
  "id": "salutations",
  "title": "Salutations",
  "description": "Bonjour, au revoir",
  "cards": []
}
```

### PUT /api/lessons/{id}

```json
{
  "title": "Nouveau titre",
  "cards": [...]
}
```

## Persistence

Donnees stockees dans `/home/claudeuser/xam-xam/data/lessons.json`.
Audio dans `/home/claudeuser/xam-xam/public/audio/{lesson_id}/`.

## CORS

Origines autorisees:
- `http://localhost:5173` (dev Vite)
- `https://xam-xam.pages.dev` (prod Cloudflare Pages)
