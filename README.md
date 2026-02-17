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

## Configuration

Non-sensitive defaults are now defined in `src/config.ts`:

- Discord client ID + guild ID
- masked account metadata shown by `/account-info`
- Fortnite cosmetics API URL
- Epic account service base URL

Runtime secrets are **not** hardcoded and must be provided as environment variables:

- `DISCORD_TOKEN`
- `EPIC_OAUTH_BASIC` (base64 of `client_id:client_secret`)

Example run:

```bash
export DISCORD_TOKEN="<your-bot-token>"
export EPIC_OAUTH_BASIC="<base64-client-id-colon-secret>"
npm run dev
```

On Windows PowerShell:

```powershell
$env:DISCORD_TOKEN="<your-bot-token>"
$env:EPIC_OAUTH_BASIC="<base64-client-id-colon-secret>"
npm run dev
```

If you prefer, you can also create a local `.env` file with those two keys.

## Setup

```bash
npm install
```

## Register commands

```bash
export DISCORD_TOKEN="<your-bot-token>"
npm run build
node dist/registerCommands.js
```

## Important

- `/equip` and `/ghost-equip` currently produce a "ghost equip" style response card and resolve cosmetic by **name or ID**.
- This project does not include hidden/desync exploit packet manipulation; it is a bot-side cosmetic selection and preview workflow.
