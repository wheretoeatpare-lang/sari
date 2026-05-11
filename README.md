# 🏪 Utang Tracker

> I-track ang utang ng iyong mga suki! Simple, offline-first, para sa sari-sari store.

## Features
- 📵 **Offline-first** – gumagana kahit walang internet
- 💾 **Local storage** – Dexie.js (IndexedDB) sa phone
- ☁️ **Auto-sync** – mag-sisync sa Supabase pag may internet
- 📱 **PWA** – pwedeng i-install sa phone
- 💚 **Tagalog UI** – madaling gamitin ng tindera

## Quick Start

```bash
npm install
cp .env.example .env    # optional: add Supabase credentials
npm run dev
```

## Supabase Setup (Optional)

1. Gumawa ng Supabase project sa https://supabase.com
2. I-run ang `supabase-schema.sql` sa SQL Editor
3. I-copy ang Project URL at anon key papunta sa `.env`

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** Gumagana ang app kahit walang Supabase. Locally lang mase-save.

## Deploy sa Cloudflare Pages

1. I-push sa GitHub
2. Mag-connect ng repo sa Cloudflare Pages
3. Build command: `npm run build`
4. Build output: `dist`
5. I-add ang environment variables sa Cloudflare dashboard

## Tech Stack
- **React + Vite** – Fast development
- **Tailwind CSS** – Mobile-first styling
- **Dexie.js** – IndexedDB wrapper para sa offline storage
- **Supabase** – Cloud database para sa sync
- **vite-plugin-pwa** – PWA support

## Folder Structure
```
src/
├── components/     # Reusable UI components
├── context/        # Global state (AppContext)
├── db/             # Database logic (Dexie + Supabase + SyncEngine)
├── pages/          # Screen pages
└── utils/          # Helpers (format, etc.)
```

## Database Design
- `customers` – Profile ng mga suki
- `transactions` – Lahat ng utang/bayad (hindi nide-delete)
- `transaction_items` – Line items ng bawat utang

Balances ay **computed dynamically** mula sa transactions – hindi naka-store bilang field.
