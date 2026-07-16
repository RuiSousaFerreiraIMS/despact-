// Gera os ícones PWA a partir da marca vectorial do Despact.
// Executar quando a marca mudar: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Marca: três barras ascendentes em verde-nota sobre tinta — crescimento
// financeiro. Geométrica de propósito: renderiza igual em qualquer ambiente.
const icon = (padding) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${padding > 0 ? 0 : 116}" fill="#1E2230"/>
  <g transform="translate(${padding} ${padding}) scale(${(512 - padding * 2) / 512})">
    <rect x="118" y="266" width="64" height="128" rx="18" fill="#128a63"/>
    <rect x="224" y="196" width="64" height="198" rx="18" fill="#17a578"/>
    <rect x="330" y="118" width="64" height="276" rx="18" fill="#20c78f"/>
  </g>
</svg>`;

mkdirSync("public", { recursive: true });

// Ícones normais: cantos arredondados próprios.
await sharp(Buffer.from(icon(0))).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(Buffer.from(icon(0))).resize(512, 512).png().toFile("public/icon-512.png");
// Maskable: quadrado cheio com margem de segurança (o sistema recorta).
await sharp(Buffer.from(icon(64))).resize(512, 512).png().toFile("public/icon-maskable-512.png");
// Apple touch icon (o iOS arredonda sozinho).
await sharp(Buffer.from(icon(48))).resize(180, 180).png().toFile("public/apple-icon.png");

console.log("OK: icones gerados em public/");
