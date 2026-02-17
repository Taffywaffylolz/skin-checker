import { Cosmetic, LockerSlot } from "../types.js";

const rarityColors: Record<string, string> = {
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

const esc = (v: string): string =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildLockerSvg(
  accountLabel: string,
  slots: LockerSlot[],
  lookup: (id: string) => Cosmetic | undefined
): string {
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
}
