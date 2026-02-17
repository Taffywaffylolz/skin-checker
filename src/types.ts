export type FortniteRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "marvel"
  | "dc"
  | "icon"
  | "gaminglegends"
  | "starwars"
  | "unknown";

export interface CosmeticImage {
  icon?: string;
  featured?: string;
}

export interface Cosmetic {
  id: string;
  name: string;
  description?: string;
  type: string;
  rarity: FortniteRarity;
  image?: CosmeticImage;
}

export interface LockerSlot {
  slot: string;
  cosmeticId: string;
}

export interface EpicDeviceAuthStart {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}

export interface EpicAccessToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  accountId: string;
  displayName?: string;
}

export interface EpicSession {
  discordUserId: string;
  accountId: string;
  displayName?: string;
  accessToken: string;
  expiresAt: number;
}
