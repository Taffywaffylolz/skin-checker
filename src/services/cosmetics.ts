import { Cosmetic, FortniteRarity } from "../types.js";
import { BOT_CONFIG } from "../config.js";

interface RawCosmetic {
  id: string;
  name?: string;
  description?: string;
  type?: {
    value?: string;
  };
  rarity?: {
    value?: string;
  };
  images?: {
    icon?: string;
    featured?: string;
  };
}

const DEFAULT_API_URL = BOT_CONFIG.cosmeticsApiUrl;

const normalizeRarity = (value?: string): FortniteRarity => {
  const normalized = value?.toLowerCase();
  if (!normalized) return "unknown";

  const allowed: FortniteRarity[] = [
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
    "marvel",
    "dc",
    "icon",
    "gaminglegends",
    "starwars"
  ];

  return allowed.includes(normalized as FortniteRarity)
    ? (normalized as FortniteRarity)
    : "unknown";
};

export class CosmeticsService {
  private cache: Cosmetic[] = [];

  async sync(): Promise<number> {
    const response = await fetch(DEFAULT_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch cosmetics (${response.status})`);
    }

    const payload = (await response.json()) as { data?: RawCosmetic[] };
    const data = payload.data ?? [];

    this.cache = data
      .filter((entry) => entry.id && entry.name)
      .map((entry) => ({
        id: entry.id,
        name: entry.name ?? "Unknown",
        description: entry.description,
        type: entry.type?.value ?? "unknown",
        rarity: normalizeRarity(entry.rarity?.value),
        image: {
          icon: entry.images?.icon,
          featured: entry.images?.featured
        }
      }));

    return this.cache.length;
  }

  findByName(term: string): Cosmetic[] {
    const q = term.toLowerCase().trim();
    if (!q) return [];
    return this.cache
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 25);
  }

  resolveByNameOrId(term: string): Cosmetic | undefined {
    const q = term.trim().toLowerCase();
    if (!q) return undefined;

    const exactId = this.cache.find((item) => item.id.toLowerCase() === q);
    if (exactId) return exactId;

    const exactName = this.cache.find((item) => item.name.toLowerCase() === q);
    if (exactName) return exactName;

    return this.cache.find((item) => item.name.toLowerCase().includes(q));
  }

  getById(id: string): Cosmetic | undefined {
    return this.cache.find((item) => item.id.toLowerCase() === id.toLowerCase());
  }
}
