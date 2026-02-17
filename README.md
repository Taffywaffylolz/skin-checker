# Discord TypeScript Fortnite Skin Checker (single-file JS remake)

Remade as **one JavaScript file**: `index.js`.

## Run

```bash
npm install
export DISCORD_TOKEN="<your-discord-bot-token>"
npm start
```

PowerShell:

```powershell
npm install
$env:DISCORD_TOKEN="<your-discord-bot-token>"
npm start
```

## Slash commands

- The bot uses **Discord slash commands only** (e.g. `/login`, `/equip`, `/locker-preview`).
- Slash commands are auto-synced on startup for the configured guild.
- You can still force manual sync:

```bash
export DISCORD_TOKEN="<your-discord-bot-token>"
npm run register
```

## Notes

- All bot logic is in `index.js` (commands, Epic auth flow, cosmetics cache/search, locker SVG rendering).
- Non-sensitive defaults (client ID/guild ID/API URLs/account mask) are embedded in `index.js`.
- Required runtime secret remains env var: `DISCORD_TOKEN`.

If you really want local hardcoded token fallback for quick testing, set `DISCORD_TOKEN_INLINE` in `index.js` on your machine only (do not commit real tokens).


- `/account-info` now attempts to show live Epic profile fields (display name, account id, country, language, last login, and email when available) plus cosmetics catalog sync stats.

`/login` uses Epic device-code (user-code) flow with an embedded usercode client token.
