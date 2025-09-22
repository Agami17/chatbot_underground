# Gumi Chat

Monorepo:
- `apps/api` – Express + Gemini
- `apps/web` – Vite + React

## Jalankan Lokal
### API
cd apps/api
cp .env.example .env   # isi GEMINI_API_KEY
npm i
npm run dev

### Web
cd ../web
cp .env.example .env
npm i
npm run dev
EOF

git add README.md
git commit -m "docs: add README with setup & run steps"
git push
