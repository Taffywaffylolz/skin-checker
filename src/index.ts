import "dotenv/config";
import {
  AttachmentBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Interaction
} from "discord.js";
import { CosmeticsService } from "./services/cosmetics.js";
import { EpicAuthService } from "./services/epicAuth.js";
import { buildLockerSvg } from "./render/lockerSvg.js";
import { LockerSlot } from "./types.js";
import { BOT_CONFIG, getDiscordToken } from "./config.js";

const cosmeticsService = new CosmeticsService();
const epicAuthService = new EpicAuthService();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const buildGhostEquipEmbed = (name: string, cosmeticId: string, image?: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(0x111827)
    .setTitle("🛡 Ghost Equip")
    .setDescription(
      `Successfully equipped **${name}**\n\`${cosmeticId}\`\nNote: This command provides a visual ghost-equip preview card.`
    );

  if (image) {
    embed.setThumbnail(image);
  }

  return embed;
};

async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
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
}

async function handleChatCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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
          .addFields(
            { name: "Expires in", value: `${payload.expiresIn}s`, inline: true },
            { name: "Poll interval", value: `${payload.interval}s`, inline: true }
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
      await interaction.reply({
        content: "No cosmetic found. Try a broader name.",
        ephemeral: true
      });
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

    if (top.image?.icon) {
      embed.setThumbnail(top.image.icon);
    }

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
      await interaction.reply({
        content: "Cosmetic not found. Try another name or ID.",
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      ephemeral: true,
      embeds: [buildGhostEquipEmbed(cosmetic.name, cosmetic.id, cosmetic.image?.icon)]
    });
    return;
  }

  if (interaction.commandName === "locker-preview") {
    const slots: LockerSlot[] = [
      { slot: "Skin", cosmeticId: interaction.options.getString("skin", true) }
    ];

    const optional: Array<{ key: string; label: string }> = [
      { key: "backbling", label: "Backbling" },
      { key: "pickaxe", label: "Pickaxe" },
      { key: "emote", label: "Emote" }
    ];

    for (const item of optional) {
      const value = interaction.options.getString(item.key);
      if (value) slots.push({ slot: item.label, cosmeticId: value });
    }

    const svg = buildLockerSvg(
      `Requested by ${interaction.user.username}`,
      slots,
      (id) => cosmeticsService.getById(id)
    );

    const attachment = new AttachmentBuilder(Buffer.from(svg, "utf-8"), {
      name: "locker-preview.svg"
    });

    await interaction.reply({
      content: "Generated locker preview.",
      files: [attachment]
    });
    return;
  }

  if (interaction.commandName === "account-info") {
    const session = epicAuthService.getSession(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle("Account info")
      .setDescription("Only non-sensitive configured metadata is shown.")
      .addFields(
        {
          name: "Display email",
          value: BOT_CONFIG.accountEmailMasked,
          inline: true
        },
        {
          name: "Region",
          value: BOT_CONFIG.accountRegion,
          inline: true
        },
        {
          name: "Epic login",
          value: session ? `Logged in as ${session.displayName ?? session.accountId}` : "Not logged in",
          inline: false
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function onInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isAutocomplete()) {
    await handleAutocomplete(interaction);
    return;
  }

  if (interaction.isChatInputCommand()) {
    await handleChatCommand(interaction);
  }
}

client.once("ready", async () => {
  try {
    const total = await cosmeticsService.sync();
    console.log(`Logged in as ${client.user?.tag}. Cached ${total} cosmetics.`);
  } catch (error) {
    console.error("Cosmetics sync failed:", error);
    console.log(`Logged in as ${client.user?.tag} (without cosmetics cache).`);
  }
});

client.on("interactionCreate", (interaction) => {
  onInteraction(interaction).catch((error) => {
    console.error("Command error:", error);
  });
});

function bootstrap(): void {
  let token: string;
  try {
    token = getDiscordToken();
  } catch (error) {
    console.error("Missing DISCORD_TOKEN. Set it in your shell or a .env file before running.");
    console.error(error);
    process.exit(1);
    return;
  }

  client.login(token).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

bootstrap();
