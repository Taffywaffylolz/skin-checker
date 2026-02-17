# Discord TypeScript Fortnite Skin Checker

Discord bot with Epic device-code login, cosmetic search, autocomplete equip picker, and locker preview rendering.

## Features

- Epic login with user-code flow:
  - `/login` → returns user code + verification URL
  - `/login-complete device-code:<value>` → finalizes login
- Cosmetic search:
  - `/cosmetic name:<text>`
- Equip-style embed card with image thumbnail:
  - `/equip name-or-id:<name-or-id>`
  - `/ghost-equip name-or-id:<name-or-id>` (alias)
- Locker image rendering:
  - `/locker-preview skin:<id> [backbling:<id>] [pickaxe:<id>] [emote:<id>]`
- Option list/autocomplete for equip and locker params (name lookup, value submitted as item ID).

## Setup

```bash
npm install
cp .env.example .env
```

Set Discord and Epic OAuth values in `.env`.

## Epic OAuth notes

This build uses Epic account service device authorization endpoints inspired by the docs you linked.

Required env:

- `EPIC_OAUTH_BASIC`: base64 of `client_id:client_secret`

## Register commands

```bash
npm run build
node dist/registerCommands.js
```

## Run

```bash
npm run dev
```

## Important

- `/equip` and `/ghost-equip` currently produce a "ghost equip" style response card and resolve cosmetic by **name or ID**.
- This project does not include hidden/desync exploit packet manipulation; it is a bot-side cosmetic selection and preview workflow.
