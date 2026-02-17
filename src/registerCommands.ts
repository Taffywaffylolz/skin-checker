import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commandData } from "./commands/definitions.js";
import { BOT_CONFIG, getDiscordToken } from "./config.js";

async function main(): Promise<void> {
  const token = getDiscordToken();
  const clientId = BOT_CONFIG.discordClientId;
  const guildId = BOT_CONFIG.discordGuildId;

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commandData
  });

  console.log(`Registered ${commandData.length} guild commands.`);
}

main().catch((error) => {
  if (error instanceof Error && error.message.includes("DISCORD_TOKEN")) {
    console.error("Missing DISCORD_TOKEN. Set it in your shell or a .env file before registering commands.");
  }
  console.error(error);
  process.exit(1);
});
