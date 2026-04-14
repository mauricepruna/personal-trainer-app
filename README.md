# Personal Trainer App

PWA personal training app built with Next.js 14, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **PWA:** next-pwa (installable, offline support)
- **Forms:** React Hook Form + Zod
- **State:** Zustand
- **Dark mode:** next-themes

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Running as a Background Service (macOS)

To have the dev server start automatically at login and run in the background:

1. Make sure the plist is in place (already committed at `~/Library/LaunchAgents/com.personal-trainer-app.dev.plist`).

2. Load the service:

```bash
launchctl load ~/Library/LaunchAgents/com.personal-trainer-app.dev.plist
```

The server starts on `0.0.0.0:3000` and is reachable from other devices on the same network (e.g. your phone). It restarts automatically if it crashes.

**Useful commands:**

```bash
# Stop
launchctl unload ~/Library/LaunchAgents/com.personal-trainer-app.dev.plist

# Start
launchctl load ~/Library/LaunchAgents/com.personal-trainer-app.dev.plist

# Check status (look for com.personal-trainer-app.dev)
launchctl list | grep personal-trainer

# View logs
tail -f ~/Library/Logs/personal-trainer-app.log
```

## PWA

The app is installable as a PWA. In production (`npm run build && npm start`), the service worker is active and the app can be installed via "Add to Home Screen" on mobile browsers.

## Project Structure

```
app/
  (auth)/           # Login & signup (no nav)
  (app)/            # Authenticated app (with nav shell)
  api/auth/         # Auth callback route
components/
  auth/             # Login & signup forms
  ui/               # Shared UI components
lib/
  supabase/         # Supabase client helpers (browser, server, middleware)
  i18n/             # i18n dictionaries & context (en/es)
```
