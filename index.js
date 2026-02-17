import "dotenv/config";
import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

const BOT_CONFIG = {
  discordClientId: "1473243732475117639",
  discordGuildId: "1467584748263182409",
  accountEmailMasked: "j***@example.com",
  accountRegion: "NAE",
  cosmeticsApiUrl: "https://fortnite-api.com/v2/cosmetics/br",
  epicAccountBaseUrl: "https://account-public-service-prod.ol.epicgames.com"
};

const getDiscordToken = () => {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error("DISCORD_TOKEN is required in runtime environment");
  }

  return token;
};

const getEpicOAuthBasic = () => {
  const value = process.env.EPIC_OAUTH_BASIC;
  if (!value) {
    throw new Error("EPIC_OAUTH_BASIC is required in runtime environment");
  }

  return value;
};

const rarityColors = {
  common: "#8a8a8a",
  uncommon: "#3dbd4b",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
  marvel: "#ef4444",
  dc: "#2563eb",
  icon: "#06b6d4",
  gaminglegends: "#22c55e",
  starwars: "#eab308",
  unknown: "#6b7280"
};

const commandData = [
  new SlashCommandBuilder().setName("login").setDescription("Start Epic Games device-code login flow"),
  new SlashCommandBuilder()
    .setName("login-complete")
    .setDescription("Complete Epic login after entering your user code")
    .addStringOption((opt) =>
      opt
        .setName("device-code")
        .setDescription("Device code returned by /login")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("cosmetic")
    .setDescription("Search Fortnite cosmetics by name")
    .addStringOption((opt) =>
      opt.setName("name").setDescription("Cosmetic name").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("equip")
    .setDescription("Equip-like ghost preview card (requires /login first)")
    .addStringOption((opt) =>
      opt
        .setName("name-or-id")
        .setDescription("Name or ID of the cosmetic")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("ghost-equip")
    .setDescription("Alias for /equip")
    .addStringOption((opt) =>
      opt
        .setName("name-or-id")
        .setDescription("Name or ID of the cosmetic")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("locker-preview")
    .setDescription("Generate a locker-style preview image for selected items")
    .addStringOption((opt) =>
      opt
        .setName("skin")
        .setDescription("Skin cosmetic ID")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("backbling")
        .setDescription("Backbling cosmetic ID")
        .setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("pickaxe")
        .setDescription("Pickaxe cosmetic ID")
        .setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt.setName("emote").setDescription("Emote cosmetic ID").setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("account-info")
    .setDescription("Show non-sensitive account metadata configured for this bot")
].map((cmd) => cmd.toJSON());

const normalizeRarity = (value) => {
  const normalized = value?.toLowerCase();
  if (!normalized) return "unknown";
  return Object.prototype.hasOwnProperty.call(rarityColors, normalized)
    ? normalized
    : "unknown";
};

class CosmeticsService {
  #cache = [];

  async sync() {
    const response = await fetch(BOT_CONFIG.cosmeticsApiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch cosmetics (${response.status})`);
    }

    const payload = await response.json();
    const data = payload.data ?? [];

    this.#cache = data
      .filter((entry) => entry.id && entry.name)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        type: entry.type?.value ?? "unknown",
        rarity: normalizeRarity(entry.rarity?.value),
        image: {
          icon: entry.images?.icon,
          featured: entry.images?.featured
        }
      }));

    return this.#cache.length;
  }

  findByName(term) {
    const q = term.toLowerCase().trim();
    if (!q) return [];
    return this.#cache.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 25);
  }

  resolveByNameOrId(term) {
    const q = term.trim().toLowerCase();
    if (!q) return undefined;

    return (
      this.#cache.find((item) => item.id.toLowerCase() === q) ||
      this.#cache.find((item) => item.name.toLowerCase() === q) ||
      this.#cache.find((item) => item.name.toLowerCase().includes(q))
    );
  }

  getById(id) {
    return this.#cache.find((item) => item.id.toLowerCase() === id.toLowerCase());
  }
}

class EpicAuthService {
  #sessions = new Map();

  getSession(discordUserId) {
    const session = this.#sessions.get(discordUserId);
    if (!session) return undefined;

    if (Date.now() > session.expiresAt) {
      this.#sessions.delete(discordUserId);
      return undefined;
    }

    return session;
  }

  async startDeviceAuth() {
    const response = await fetch(
      `${BOT_CONFIG.epicAccountBaseUrl}/account/api/oauth/deviceAuthorization`,
      {
        method: "POST",
        headers: {
          Authorization: `basic ${getEpicOAuthBasic()}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ prompt: "login" })
      }
    );

    if (!response.ok) {
      throw new Error(`Device auth start failed (${response.status})`);
    }

    const payload = await response.json();
    return {
      deviceCode: payload.device_code,
      userCode: payload.user_code,
      verificationUri: payload.verification_uri,
      verificationUriComplete: payload.verification_uri_complete,
      expiresIn: payload.expires_in,
      interval: payload.interval
    };
  }

  async pollDeviceAuth(deviceCode) {
    const response = await fetch(`${BOT_CONFIG.epicAccountBaseUrl}/account/api/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `basic ${getEpicOAuthBasic()}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "device_code",
        device_code: deviceCode,
        token_type: "eg1"
      })
    });

    if (!response.ok) {
      throw new Error(`Token poll failed (${response.status}): ${await response.text()}`);
    }

    const payload = await response.json();
    return {
      accessToken: payload.access_token,
      expiresIn: payload.expires_in,
      accountId: payload.account_id,
      displayName: payload.displayName
    };
  }

  saveSession(discordUserId, token) {
    const session = {
      discordUserId,
      accountId: token.accountId,
      displayName: token.displayName,
      accessToken: token.accessToken,
      expiresAt: Date.now() + token.expiresIn * 1000 - 10000
    };

    this.#sessions.set(discordUserId, session);
    return session;
  }
}

const esc = (v) =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const buildLockerSvg = (accountLabel, slots, lookup) => {
  const cellW = 250;
  const cellH = 260;
  const cols = 3;
  const rows = Math.max(1, Math.ceil(slots.length / cols));
  const width = cols * cellW + 80;
  const height = rows * cellH + 140;

  const cells = slots
    .map((slot, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 40 + col * cellW;
      const y = 80 + row * cellH;
      const cosmetic = lookup(slot.cosmeticId);
      const name = cosmetic?.name ?? slot.cosmeticId;
      const rarity = cosmetic?.rarity ?? "unknown";
      const color = rarityColors[rarity] ?? rarityColors.unknown;
      const image = cosmetic?.image?.icon;

      return `
      <g>
        <rect x="${x}" y="${y}" width="220" height="230" rx="18" fill="#111827" stroke="${color}" stroke-width="4" />
        ${
          image
            ? `<image href="${esc(image)}" x="${x + 15}" y="${y + 15}" width="190" height="140" preserveAspectRatio="xMidYMid meet" />`
            : `<rect x="${x + 15}" y="${y + 15}" width="190" height="140" fill="#1f2937" rx="12" />`
        }
        <text x="${x + 15}" y="${y + 185}" fill="#ffffff" font-size="17" font-family="Arial" font-weight="700">${esc(
          slot.slot
        )}</text>
        <text x="${x + 15}" y="${y + 210}" fill="#d1d5db" font-size="15" font-family="Arial">${esc(
          name
        )}</text>
        <text x="${x + 15}" y="${y + 228}" fill="${color}" font-size="13" font-family="Arial">${esc(
          rarity.toUpperCase()
        )}</text>
      </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect x="0" y="0" width="100%" height="100%" fill="#030712" />
  <text x="40" y="46" fill="#f9fafb" font-size="30" font-family="Arial" font-weight="700">Locker Preview</text>
  <text x="40" y="70" fill="#9ca3af" font-size="16" font-family="Arial">${esc(accountLabel)}</text>
  ${cells}
</svg>`;
};

const buildGhostEquipEmbed = (name, cosmeticId, image) => {
  const embed = new EmbedBuilder()
    .setColor(0x111827)
    .setTitle("🛡 Ghost Equip")
    .setDescription(
      `Successfully equipped **${name}**\n\`${cosmeticId}\`\nNote: This command provides a visual ghost-equip preview card.`
    );

  if (image) embed.setThumbnail(image);
  return embed;
};

async function registerCommands() {
  const token = getDiscordToken();
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(
    Routes.applicationGuildCommands(BOT_CONFIG.discordClientId, BOT_CONFIG.discordGuildId),
    { body: commandData }
  );
  console.log(`Registered ${commandData.length} guild commands.`);
}

async function runBot() {
  const token = getDiscordToken();
  const cosmeticsService = new CosmeticsService();
  const epicAuthService = new EpicAuthService();
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", async () => {
    try {
      const total = await cosmeticsService.sync();
      console.log(`Logged in as ${client.user?.tag}. Cached ${total} cosmetics.`);
    } catch (error) {
      console.error("Cosmetics sync failed:", error);
      console.log(`Logged in as ${client.user?.tag} (without cosmetics cache).`);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        const focused = interaction.options.getFocused(true);
        if (!["name-or-id", "skin", "backbling", "pickaxe", "emote"].includes(focused.name)) {
          await interaction.respond([]);
          return;
        }

        const matches = cosmeticsService.findByName(focused.value).slice(0, 25);
        await interaction.respond(
          matches.map((item) => ({
            name: `${item.name} - ${item.type}`.slice(0, 100),
            value: item.id
          }))
        );
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === "login") {
        const payload = await epicAuthService.startDeviceAuth();
        await interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865f2)
              .setTitle("Epic login (device code)")
              .setDescription(
                `1) Open: ${payload.verificationUriComplete}\n2) Enter code: **${payload.userCode}**\n3) Run \`/login-complete device-code:${payload.deviceCode}\``
              )
          ]
        });
        return;
      }

      if (interaction.commandName === "login-complete") {
        const deviceCode = interaction.options.getString("device-code", true);
        await interaction.deferReply({ ephemeral: true });
        const tokenPayload = await epicAuthService.pollDeviceAuth(deviceCode);
        const session = epicAuthService.saveSession(interaction.user.id, tokenPayload);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x22c55e)
              .setTitle("Login successful")
              .setDescription(
                `Authenticated Epic account: **${session.displayName ?? "Unknown"}**\nAccount ID: \`${session.accountId}\``
              )
          ]
        });
        return;
      }

      if (interaction.commandName === "cosmetic") {
        const term = interaction.options.getString("name", true);
        const results = cosmeticsService.findByName(term);
        if (!results.length) {
          await interaction.reply({ content: "No cosmetic found. Try a broader name.", ephemeral: true });
          return;
        }

        const top = results[0];
        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle(top.name)
          .setDescription(top.description ?? "No description available.")
          .addFields(
            { name: "ID", value: top.id, inline: true },
            { name: "Type", value: top.type, inline: true },
            { name: "Rarity", value: top.rarity, inline: true }
          );

        if (top.image?.icon) embed.setThumbnail(top.image.icon);
        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (interaction.commandName === "equip" || interaction.commandName === "ghost-equip") {
        const session = epicAuthService.getSession(interaction.user.id);
        if (!session) {
          await interaction.reply({
            content: "You need to run `/login` first, then complete with `/login-complete`.",
            ephemeral: true
          });
          return;
        }

        const term = interaction.options.getString("name-or-id", true);
        const cosmetic = cosmeticsService.resolveByNameOrId(term);
        if (!cosmetic) {
          await interaction.reply({ content: "Cosmetic not found. Try another name or ID.", ephemeral: true });
          return;
        }

        await interaction.reply({
          ephemeral: true,
          embeds: [buildGhostEquipEmbed(cosmetic.name, cosmetic.id, cosmetic.image?.icon)]
        });
        return;
      }

      if (interaction.commandName === "locker-preview") {
        const slots = [{ slot: "Skin", cosmeticId: interaction.options.getString("skin", true) }];
        for (const item of [
          { key: "backbling", label: "Backbling" },
          { key: "pickaxe", label: "Pickaxe" },
          { key: "emote", label: "Emote" }
        ]) {
          const value = interaction.options.getString(item.key);
          if (value) slots.push({ slot: item.label, cosmeticId: value });
        }

        const svg = buildLockerSvg(`Requested by ${interaction.user.username}`, slots, (id) =>
          cosmeticsService.getById(id)
        );
        await interaction.reply({
          content: "Generated locker preview.",
          files: [new AttachmentBuilder(Buffer.from(svg, "utf-8"), { name: "locker-preview.svg" })]
        });
        return;
      }

      if (interaction.commandName === "account-info") {
        const session = epicAuthService.getSession(interaction.user.id);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x22c55e)
              .setTitle("Account info")
              .setDescription("Only non-sensitive configured metadata is shown.")
              .addFields(
                { name: "Display email", value: BOT_CONFIG.accountEmailMasked, inline: true },
                { name: "Region", value: BOT_CONFIG.accountRegion, inline: true },
                {
                  name: "Epic login",
                  value: session ? `Logged in as ${session.displayName ?? session.accountId}` : "Not logged in"
                }
              )
          ],
          ephemeral: true
        });
      }
    } catch (error) {
      console.error("Command error:", error);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "Command failed. Check server logs.", ephemeral: true });
      }
    }
  });

  await client.login(token);
}

const mode = process.argv[2];
if (mode === "register") {
  registerCommands().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  runBot().catch((error) => {
    if (error instanceof Error && error.message.includes("DISCORD_TOKEN")) {
      console.error("Missing DISCORD_TOKEN. Set it in your shell or a .env file before running.");
    }
    console.error(error);
    process.exit(1);
  });
}
