import { SlashCommandBuilder } from "discord.js";

export const commandData = [
  new SlashCommandBuilder()
    .setName("login")
    .setDescription("Start Epic Games device-code login flow"),
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
