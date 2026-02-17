# Discord TypeScript Fortnite Skin Checker (single-file JS remake)

Remade as **one JavaScript file**: `index.js`.

## Run

```bash
npm install
export DISCORD_TOKEN="<your-discord-bot-token>"
export EPIC_OAUTH_BASIC="<base64-client-id-colon-secret>"
npm start
```

PowerShell:

```powershell
npm install
$env:DISCORD_TOKEN="<your-discord-bot-token>"
$env:EPIC_OAUTH_BASIC="<base64-client-id-colon-secret>"
npm start
```

## Register slash commands

```bash
export DISCORD_TOKEN="<your-discord-bot-token>"
npm run register
```

## Notes

- All bot logic is in `index.js` (commands, Epic auth flow, cosmetics cache/search, locker SVG rendering).
- Non-sensitive defaults (client ID/guild ID/API URLs/account mask) are embedded in `index.js`.
- Required runtime secrets remain env vars: `DISCORD_TOKEN`, `EPIC_OAUTH_BASIC`.
