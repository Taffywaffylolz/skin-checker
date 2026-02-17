export const BOT_CONFIG = {
  discordClientId: "1473243732475117639",
  discordGuildId: "1467584748263182409",
  accountEmailMasked: "j***@example.com",
  accountRegion: "NAE",
  cosmeticsApiUrl: "https://fortnite-api.com/v2/cosmetics/br",
  epicAccountBaseUrl: "https://account-public-service-prod.ol.epicgames.com"
} as const;

export const getDiscordToken = (): string => {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error("DISCORD_TOKEN is required in runtime environment");
  }

  return token;
};

export const getEpicOAuthBasic = (): string => {
  const value = process.env.EPIC_OAUTH_BASIC;
  if (!value) {
    throw new Error("EPIC_OAUTH_BASIC is required in runtime environment");
  }

  return value;
};
